#!/usr/bin/env python3

import os, sys, subprocess, shutil, csv, random, cgi, cgitb, glob, mimetypes, json
import magic

def random_id():
	return str(random.randint(0, 2**32))

cgitb.enable()

print("Content-type:text/plain\r\n\r\n")
	
form = cgi.FieldStorage()
uploaded_file = form.getvalue('recording')
transcript = form.getvalue('transcript')

filetype = magic.from_buffer(uploaded_file)

id = random_id()
os.mkdir('/rec/' + id)

# Noise Removal
tmp_dir      = '/rec/' + id
input_file   = tmp_dir + '/orig'
format_file  = tmp_dir + '/format.wav'
silence_file = tmp_dir + '/silence.wav'
clean_file   = tmp_dir + '/clean.wav'
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

# Forced Alignment
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
	subprocess.check_output([tmp_dir + '/align.sh'], stderr=subprocess.STDOUT) # shell out so we can `source`
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

for recording, grid in zip(
	glob.glob(corpus_dir + '/*.wav'), 
	glob.glob(output_dir + '/*.TextGrid')
):

	sheet = subprocess.check_output([
		'./textgrid-formants.praat', recording, grid
	])
#		with open(str.replace(grid, 'TextGrid', 'tsv'), 'w') as f:
#			f.write(sheet.decode('utf-8'))
	
	praat_output = sheet.decode('utf-8')

	data = [{ 
		'time' : None if '--' in e[0] else float(e[0]),
		'phone' : e[1],
		'F' : [None if '--' in f else float(f) for f in e[2:-1]]
	} for e in [line.split('\t') for line in praat_output.split('\n')] if len(e) > 4]

	for e in data:
		if not e['phone'] in stats: continue
		e['F_stdevs'] = [
			None if len(e['F']) <= i or e['F'][i] == None else 
			(e['F'][i] - stats[e['phone']][i]['mean']) / stats[e['phone']][i]['stdev']
			for i in list(range(4))
		]

	print(json.dumps(data))
	

