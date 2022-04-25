#!/usr/bin/env python3

print('corpusanalysis.py: __package__ ->', __package__)

import os, subprocess, json
from collections import defaultdict 
from statistics import mean, median, stdev

from library import preprocessing, phones, resonance

corpus_dir = './corpus'
processed_corpus_dir = './corpus-processed'

if not os.path.exists(processed_corpus_dir):
	os.mkdir(processed_corpus_dir)

	subprocess.run(['chmod', '777', '-R', processed_corpus_dir])

	for directory in os.listdir(corpus_dir):
		transcript = ''
		recording = None
		for filename in os.listdir(corpus_dir + '/' + directory):
			if '.txt' in filename:
				with open(corpus_dir + '/' + directory + '/' + filename) as f:
					transcript = f.read()
			elif len([
				ftype for ftype in 
				['.wav', '.mp3', '.ogg', '.opus'] 
				if ftype in filename]
			) == 1:
				with open(corpus_dir + '/' + directory + '/' + filename, 'rb') as f:
					recording = f.read()

		out_dir = processed_corpus_dir + '/' + directory
		if not os.path.exists(out_dir): os.mkdir(out_dir)
		subprocess.run(['chmod', '777', '-R', out_dir])

		preprocessing.process(recording, transcript, out_dir)
				
m_count = 0
f_count = 0
m_data = []
f_data = []
for directory in os.listdir(processed_corpus_dir):
	tsv_file =  (processed_corpus_dir + '/' + directory + 
	             '/output/recording.tsv')
	if os.path.exists(tsv_file):
		with open(tsv_file) as f:
			tsv_text = f.read()

		if directory[0] == 'm': 
			m_data.append(phones.parse(tsv_text))
			m_count += 1
		if directory[0] == 'f': 
			f_data.append(phones.parse(tsv_text))
			f_count += 1

if len(f_data) > len(m_data):
	f_data = f_data[0:len(m_data)]
if len(m_data) > len(f_data):
	m_data = m_data[0:len(f_data)]

print('m_count', m_count)
print('f_count', f_count)
print('len(f_data)', len(f_data))
print('len(m_data)', len(m_data))

	
population_phones = defaultdict(list)
for data in m_data + f_data:
	for phone in data['phones']: 
		if (phone['F'] and phone['F'][0] and phone['F'][1] and 
		    phone['F'][2] and phone['F'][3]
		):
			population_phones[phone['phoneme']].append(phone)

phone_stats = {}

for phoneme in population_phones:
	print(phoneme)
	Fs = [[phone['F'][i] for phone in population_phones[phoneme] ]
	       for i in range(4)]
	for i in range(4):
		print('\tf' + str(i), mean(Fs[i]), stdev(Fs[i]))

	phone_stats[phoneme] = [
		{	'mean' : mean(Fs[i]), 
			'stdev': stdev(Fs[i]),
			'median': median(Fs[i]),
			'max': max(Fs[i]),
			'min': min(Fs[i]),
		} for i in range(4)
	]

with open('stats.json', 'w') as f:
	f.write(json.dumps(phone_stats))


# A little brute-forcing never hurt anyone.
granularity = 56
weights_candidates = []
for i in range(granularity + 1):
	for j in range(granularity + 1):
		for k in range(granularity + 1):
			if i + j + k == granularity:
				weights_candidates.append([
					i / granularity, 
					j / granularity, 
					k / granularity
				])

max_accuracy = 0
winner = None
for weights in weights_candidates:

	for data in m_data + f_data:
		resonance.compute_resonance(data, weights)

	median_resonance = median([data['meanResonance'] for data in m_data + f_data])

	correct_count = 0
	total = 0

	for data in m_data:
		if data['meanResonance'] <= median_resonance:
			correct_count += 1
		total += 1

	for data in f_data:
		if data['meanResonance'] >= median_resonance:
			correct_count += 1
		total += 1

	accuracy = correct_count / total
	if accuracy >= max_accuracy:
		max_accuracy = accuracy
		winner = weights
	print(weights, accuracy)

print('Best weight:', winner)

with open('weights.json', 'w') as f:
	f.write(json.dumps(winner))

