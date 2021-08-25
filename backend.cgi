#!/usr/bin/env python3

import os, sys, subprocess, shutil, csv, random, glob, mimetypes, json, re, statistics
import cgi, cgitb   # I like cgi because it was popular when I was born
import magic

# Helpers
clamp = lambda minimum, maximum, value : max(minimum, min(value, maximum))
random_id = lambda: str(random.randint(0, 2**32))

################## Form Handling ##################
cgitb.enable()

print("Content-type:text/plain\r\n\r\n")
	
form = cgi.FieldStorage()
uploaded_file = form.getvalue('recording')
transcript = form.getvalue('transcript')

filetype = magic.from_buffer(uploaded_file)

id = random_id()
os.mkdir('/rec/' + id)

################## Noise Removal ##################
tmp_dir       = '/rec/' + id
input_file    = tmp_dir + '/orig'
format_file   = tmp_dir + '/format.wav'
silence_file  = tmp_dir + '/silence.wav'
clean_file    = tmp_dir + '/clean.wav'
noise_profile = tmp_dir + '/noise.prof'

with open(input_file, "wb") as f: 
	f.write(uploaded_file)

assert(os.path.exists(input_file))

subprocess.check_output(['ffmpeg', '-i', input_file, format_file])

ffmpeg_silence = subprocess.check_output([
	'ffmpeg', '-i', input_file, '-af', 'silencedetect=n=-30dB:d=0.5', 
	'-f', 'null', '-'
], stderr=subprocess.STDOUT).decode('utf-8').split('\n')

silence_ranges = list(zip(
	[line.split(" ")[4] for line in ffmpeg_silence if 'silence_start' in line],
	[line.split(" ")[4] for line in ffmpeg_silence if 'silence_end' in line]
))

subprocess.check_output(['ffmpeg', '-i', input_file, 
	'-af', "aselect='" + '+'.join(
		['between(t,' + r[0] + ',' + r[1]+')' for r in silence_ranges]
	) + "', asetpts=N/SR/TB", 
	silence_file
])

assert(os.path.exists(silence_file))

subprocess.check_output(['sox', silence_file, '-n', 'noiseprof', noise_profile])
subprocess.check_output(['chmod', '777', noise_profile])
subprocess.check_output(['sox', format_file, clean_file, 'noisered', noise_profile, '0.2'])

assert(os.path.exists(clean_file))

################## Forced Alignment ##################
corpus_dir = tmp_dir + '/corpus'
output_dir = tmp_dir + '/output'
os.mkdir(corpus_dir)
os.mkdir(output_dir)

subprocess.check_output([
	'ffmpeg' , 
	'-i'     , clean_file,
	'-acodec', 'pcm_s16le',
	'-ac'    , '1',
	'-ar'    , '16000',
	corpus_dir + '/recording.wav'
])

subprocess.run(['chmod', '777', '-R', tmp_dir])

with open(corpus_dir + '/recording.txt', 'w') as f:
	f.write(transcript)

with open(tmp_dir + '/align.sh', 'w') as f:
	f.write("""#!/usr/bin/env bash
	source /opt/conda/etc/profile.d/conda.sh
	conda activate aligner
	mfa align ./corpus/ english english ./output/ --clean
	""")

assert(os.path.exists(tmp_dir + '/align.sh'))

subprocess.check_output(['chmod', '777', tmp_dir + '/align.sh'])
cwd = os.getcwd()
os.chdir(tmp_dir)

try:
	# shell out so we can `source`
	subprocess.check_output([tmp_dir + '/align.sh'], stderr=subprocess.STDOUT) 
except subprocess.CalledProcessError as e:
	print("CalledProcessError")
	print(e)
	print(str(e.output, 'utf-8'))
except Exception as e:
	print("Error")
	print(e)

os.chdir(cwd)

with open('stats.json') as f:
	stats = json.loads(f.read())

################## Phonetic Analysis ##################
for recording, grid in zip(
	glob.glob(corpus_dir + '/*.wav'), 
	glob.glob(output_dir + '/*.TextGrid')
):
	praat_output = subprocess.check_output([
		'./textgrid-formants.praat', recording, grid
	]).decode('utf-8')
	
	word_lines = []
	phoneme_lines = []
	active_list = None

	for line in praat_output.split('\n'):
		if line == "Words:":
			active_list = word_lines
			continue
		if line == "Phonemes:":
			active_list = phoneme_lines
			continue

		active_list.append(line)	
	
	data = {}

	pronunciation_dict = {}
	with open('cmudict.txt', 'r', encoding='iso-8859-1') as f:
		for line in f.readlines():
			cols = line.split()
			pronunciation_dict[cols[0]] = cols[1:]
	
	data['words'] = []
	for line in word_lines:
		cols = line.split('\t')
		data['words'].append({
			'time' : float(cols[0]),
			'word' : cols[1],
			'expected' : (pronunciation_dict.get(cols[1].upper()) or [None]) + [None] * 5
		})

	data['phones'] = []
	word_index = -1
	phoneme_in_word_index = 0
	for line in phoneme_lines:	
		cols = line.split('\t')

		if len(cols) < 3: continue

		time = float(cols[0]) if re.match(r'^-?\d+(?:\.\d+)?$', cols[0]) else None
		while (
			type(time) == float and 
			word_index < len(data['words']) - 1 and
			time >= data['words'][word_index + 1]['time']
		):
			word_index += 1
			phoneme_in_word_index = 0
			
		data['phones'].append({
			'time': time,
			'phoneme': cols[1],
			'word_index': word_index,
			'word': data['words'][word_index],
			'word_time': data['words'][word_index]['time'],
			'expected': data['words'][word_index]['expected'][phoneme_in_word_index],
			'F': [None if '--' in f else float(f) for f in cols[2:]]
		})
		phoneme_in_word_index += 1

	data['mean']  = {'F': []}
	data['stdev'] = {'F': []}

	# Remove outliers (TODO: Make configurable)
	for i in range(4):
		mean = statistics.mean([
			phoneme['F'][i] for phoneme in data['phones'] 
			if phoneme['F'][i] != None
		])
		stdev = statistics.stdev([
			phoneme['F'][i] for phoneme in data['phones']
			if phoneme['F'][i] != None
		])
		data['mean']['F'].append(mean)
		data['stdev']['F'].append(stdev)
		for p in range(len(data['phones'])):
			if not data['phones'][p]['F'][i]:
				continue
			if abs(data['phones'][p]['F'][i] - mean) / stdev > 2:
				data['phones'][p]['outlier'] = True
				data['phones'][p]['F'][i] = None
				"""statistics.mean([
					data['phones'][q]['F'][i] for q in range(i - , i + 2) if data['phones'][q]['F'][i] != None
				])"""
		
	for phone in data['phones']:
		if (not (phone.get('phoneme') and 
			phone.get('expected') and 
			stats.get(phone.get('phoneme')) and 
			stats.get(phone.get('expected')))
		): continue

		if not phone['phoneme'] and phone['expected'] in stats: continue
		phone['F_stdevs'] = [
			None if len(phone['F']) <= i or phone['F'][i] == None else 
			(phone['F'][i] - stats[phone['expected']][i]['mean']) 
			/ stats[phone['expected']][i]['stdev']
			for i in list(range(4))
		]
	


	for i in range(len(data['phones'])):
		currentPhone = data['phones'][i]
		
		isVowel = currentPhone['phoneme'] and len([
			value for value in list(currentPhone['phoneme'])
			if value in ["A", "E", "I", "O", "U", "Y"]
		]) > 1

		if ('F_stdevs' in currentPhone  and currentPhone['F_stdevs'][1] and
			currentPhone['F_stdevs'][2] and currentPhone['F_stdevs'][3]
		):
			data['phones'][i]['resonance'] = clamp(0, 1, 
				( (2/5) * currentPhone['F_stdevs'][1] 
				+ (2/5) * currentPhone['F_stdevs'][2] 
				+ (1/5) * currentPhone['F_stdevs'][3]) / 3 + .5
			)
	
	pitch_sample = [
		phone['F'][0] for phone in data['phones'] 
		if phone.get('F') and phone['F'][0] and not phone.get('outlier')
	]
	data['meanPitch'] = statistics.mean(pitch_sample)
	data['medianPitch'] = statistics.median(pitch_sample)

	resonance_sample = [
		phone['resonance'] for phone in data['phones'] 
		if phone.get('resonance') and not phone.get('outlier')
	]
	data['meanResonance'] = statistics.mean(resonance_sample)
	data['medianResonance'] = statistics.median(resonance_sample)

	print(json.dumps(data))
	

