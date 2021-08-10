#!/usr/bin/praat --run

form File
	sentence soundfile 
	sentence textgrid
endform

Read from file... 'soundfile$'
thisSound$ = selected$("Sound")

Read from file... 'textgrid$'
thisTextGrid$ = selected$("TextGrid")

select TextGrid 'thisTextGrid$'
numberOfPhonemes = Get number of intervals: 2

select Sound 'thisSound$'
To Pitch: 0, 75, 600

select Sound 'thisSound$'
To Formant (burg)... 0 5 5000 0.025 50

for thisInterval from 1 to numberOfPhonemes
	select TextGrid 'thisTextGrid$'
	thisPhoneme$ = Get label of interval: 2, thisInterval

	thisPhonemeStartTime = Get start point: 2, thisInterval
	thisPhonemeEndTime   = Get end point:   2, thisInterval
	duration = thisPhonemeEndTime - thisPhonemeStartTime
	midpoint = thisPhonemeStartTime + duration/2

	select Pitch 'thisSound$'
	f0 = Get value at time... midpoint Hertz Linear

	select Formant 'thisSound$'
	f1 = Get value at time... 1 midpoint Hertz Linear
	f2 = Get value at time... 2 midpoint Hertz Linear
	f3 = Get value at time... 3 midpoint Hertz Linear

	appendInfoLine: thisPhonemeStartTime, "	", thisPhoneme$, "	", f0, "	", f1, "	", f2, "	", f3
endfor

