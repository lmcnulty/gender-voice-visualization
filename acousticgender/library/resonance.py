import statistics
import json

clamp = lambda minimum, maximum, value : max(minimum, min(value, maximum))

def compute_resonance(data, weights=[2/5, 2/5, 1/5]):
	assert(abs(sum(weights) - 1) < .01)

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
		
	with open('stats.json') as f:
		stats = json.loads(f.read())

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
				( weights[0] * currentPhone['F_stdevs'][1] 
				+ weights[1] * currentPhone['F_stdevs'][2] 
				+ weights[2] * currentPhone['F_stdevs'][3]) / 3 + .5
			)

	pitch_sample = [
		phone['F'][0] for phone in data['phones'] 
		if phone.get('F') and phone['F'][0] and not phone.get('outlier')
	]
	resonance_sample = [
		phone['resonance'] for phone in data['phones'] 
		if phone.get('resonance') and not phone.get('outlier')
	]
	data['meanPitch'] = statistics.mean(pitch_sample)
	data['meanResonance'] = statistics.mean(resonance_sample)
	data['medianPitch'] = statistics.median(pitch_sample)
	data['medianResonance'] = statistics.median(resonance_sample)
	data['stdevPitch'] = statistics.stdev(pitch_sample)
	data['stdevResonance'] = statistics.stdev(resonance_sample)
