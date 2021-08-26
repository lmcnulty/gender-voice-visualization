import re

def parse(praat_output):
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

	return data
