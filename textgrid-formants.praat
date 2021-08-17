#!/usr/bin/praat --run

# Read in the sound and textgrid files passed as command line arguments.
form File
	sentence soundfile 
	sentence textgrid
endform

Read from file... 'soundfile$'
sound$ = selected$("Sound")

Read from file... 'textgrid$'
textGrid$ = selected$("TextGrid")


# Loop through the textgrid and print the words along with their start times.
appendInfoLine: "Words:"

select TextGrid 'textGrid$'
numberOfWords = Get number of intervals: 1

for i from 1 to numberOfWords
	select TextGrid 'textGrid$'
	word$ = Get label of interval: 1, i 
	startTime = Get start point: 1, i 
	endTime   = Get end point:   1, i 
	
	appendInfoLine: startTime, "	", word$
endfor


# Loop through the textgrid's phonemes, and print the formant values at the midpoint.
select TextGrid 'textGrid$'
numberOfPhonemes = Get number of intervals: 2

select Sound 'sound$'
To Pitch: 0, 75, 600

select Sound 'sound$'
To Formant (burg)... 0 5 5000 0.025 50

appendInfoLine: "Phonemes:"
for i from 1 to numberOfPhonemes
	select TextGrid 'textGrid$'
	phoneme$ = Get label of interval: 2, i

	startTime = Get start point: 2, i
	endTime   = Get end point:   2, i
	duration = endTime - startTime
	midpoint = startTime + duration/2

	select Pitch 'sound$'
	f0 = Get value at time... midpoint Hertz Linear

	select Formant 'sound$'
	f1 = Get value at time... 1 midpoint Hertz Linear
	f2 = Get value at time... 2 midpoint Hertz Linear
	f3 = Get value at time... 3 midpoint Hertz Linear

	appendInfoLine: startTime, "	", phoneme$, "	", f0, "	", f1, "	", f2, "	", f3
endfor



