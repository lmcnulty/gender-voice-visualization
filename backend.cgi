#!/usr/bin/env python3

import os, random, json, statistics
import cgi, cgitb   # I like cgi because it was popular when I was born

import preprocessing, phones, resonance

# Helpers
random_id = lambda: str(random.randint(0, 2**32))

################## Form Handling ##################
cgitb.enable()

print("Content-type:text/plain\r\n\r\n")
	
form = cgi.FieldStorage()
uploaded_file = form.getvalue('recording')
transcript = form.getvalue('transcript')


id = random_id()

tmp_dir = '/rec/' + id
os.mkdir(tmp_dir)

praat_output = preprocessing.process(uploaded_file, transcript, tmp_dir)

################## Phonetic Analysis ##################

data = phones.parse(praat_output)

weights = [0.7321428571428571, 0.26785714285714285, 0.0]
resonance.compute_resonance(data, weights)

print(json.dumps(data))	

