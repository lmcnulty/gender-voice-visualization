#!/usr/bin/env python3

import os, random, json, statistics
import cgi, cgitb   # I like cgi because it was popular when I was born

import preprocessing, phones, resonance
from settings import settings
import datetime

# Helpers
random_id = lambda: str(random.randint(0, 2**32))

request_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

################## Form Handling ##################
cgitb.enable()

print("Content-type:text/plain\r\n\r\n")
	
form = cgi.FieldStorage()
uploaded_file = form.getvalue('recording')
transcript = form.getvalue('transcript')


id = random_id()

tmp_dir =  settings['recordings'] + id

praat_output = preprocessing.process(uploaded_file, transcript, tmp_dir)

data = phones.parse(praat_output)

weights = [0.7321428571428571, 0.26785714285714285, 0.0]
resonance.compute_resonance(data, weights)

print(json.dumps(data))	

# Logging
if settings['logs'] and os.path.exists(settings['logs']):
	try:
		logfile = settings['logs'] + request_date.replace(' ', '_') + '_' + id + '.json'
		with open(logfile, 'w') as f:
			f.write(json.dumps({
				# Hash the IP so that we can count use by a single user
				# without compromising their privacy.
				'id': hash(os.environ.get('REMOTE_ADDR')),
				'ua': os.environ.get('HTTP_USER_AGENT'),
				'date': request_date,
				'referrer': form.getvalue('referrer'),
				'lang': form.getvalue('lang'),
				'screen-dimensions' : {
					'width' : form.getvalue('screen-width'),
					'height' : form.getvalue('screen-height'),
				}
			}))

	except:
		pass
