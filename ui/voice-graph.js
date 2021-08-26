

class VoiceGraph {

	constructor(element) {

		this.element = element;

		element.style.position = 'relative';
		element.style.boxSizing = 'border-box'
		let size = element.clientWidth;

		this.pitchUpperBoundHz = 300;
		this.pitchLowerBoundHz = 50;
		this.pitchRange = this.pitchUpperBoundHz - this.pitchLowerBoundHz;

		for (let child of [
			div({'class': 'x axis-labels'}, 
				['0%', '← Resonance →', '100%'].map((s, i) => span(
					s, {style: 'min-width: 3em; text-align: center;', 'class': i == 1 ? 'title' : ''}
				))
			),
			div({'class': 'x-opposite axis-labels'}, [
				this.xValueLabel = span('25%', {'class': 'current-value'})
			]),

			div({'class': 'y axis-labels'},
				[this.pitchUpperBoundHz + 'Hz', '← Pitch →', 
				 this.pitchLowerBoundHz + 'Hz'
				].map((s, i) => span(
					s, {style: 'min-height: 3em; text-align: center;', 'class': i == 1 ? 'title' : ''})
				)
			),
			div({'class': 'y-opposite axis-labels'}, [
				this.yValueLabel = span('25%', {'class': 'current-value'})
			]),
			
			div({'class': 'overlay'}, [
				this.xHairline = span(' ', {'class': 'x hairline'}),
				this.yHairline = span(' ', {'class': 'y hairline'}),
			], ' '),
			
			div('𝄞', {'class': 'treble clef'}),
			div('𝄢', {'class': 'bass clef'}),
			svg({'class': 'instrument flute'}, String(brightIcon)),
			svg({ 'class': 'instrument tuba'}, String(darkIcon)),

			this.canvas = create('canvas', {
				height: size, 
				width: size, 
			})
		]) {
			element.appendChild(child);
		}


		// displays a plane which blends colors
		// from cool to warm, leftward, on the x-axis
		// and from light to dark, downard, on the y-axis.
		let ctx = this.canvas.getContext('2d');
		let rgba = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		let pink = {r: 255, g: 40,  b: 0};
		let blue = {r: 0,   g: 100, b: 255};
		for (let i = 0; i < rgba.data.length; i += 4) {
			let rise = ((i/4) / rgba.height) / rgba.height;
			let run  = ((i/4) % rgba.width) / rgba.width;
			let pinkBlue = this.lighten(
				this.blend(blue, pink, (2/3)*run + (1/3)*(1 - rise)),
				1 - (1.5 * rise)**(.5)
			)
			rgba.data[i]   = pinkBlue.r;
			rgba.data[i+1] = pinkBlue.g;
			rgba.data[i+2] = pinkBlue.b;
			rgba.data[i+3] = 255;
		}
		ctx.putImageData(rgba, 0, 0);

		window.addEventListener('resize', evt => {
			for (let marker of $$('.marker')) {
				this.update(marker);
			}
		});

		globalState.render(['clips'], current => {
			for (let clip of current.clips) {
				if (!clip.marker) {
					clip.marker = this.addMarker(pitchPercent(clip.medianPitch) || .5, clip.medianResonance || .5, null, null);
					clip.marker.setAttribute('data-id', clip.id);
					clip.marker.style.background = clip.color;

					clip.marker.addEventListener('click', evt => {
						globalState.set('playingClip', clip);
						globalState.set('previewClip', clip);
					});
					clip.marker.addEventListener('mouseenter', evt => {
						globalState.set('previewClip', clip);
						for (let marker of $$('.marker')) this.update(marker);
					});
					this.update(clip.marker);
				}
			}
		})


		globalState.render(['previewClip'], current => {
			for (let marker of $$('.marker.preview')) marker.classList.remove('preview');
			if (current.previewClip && current.previewClip.marker) {
				current.previewClip.marker.classList.add('preview');
			}
		})

		globalState.render(['playingClip'], current => {
			for (let marker of $$('.marker.playing')) marker.classList.remove('playing');
			if (current.playingClip && current.playingClip.marker) {
				current.playingClip.marker.classList.add('playing');
			}
		})

		globalState.render(['playbackTime'], current  => {

			let timeIndex = Math.floor(current.playbackTime * 100);
			let playingClip = globalState.get('playingClip');
			if (!playingClip || 
				!playingClip.indexedPhones || 
				timeIndex >= playingClip.indexedPhones.length ||
				!playingClip.marker
			) return;
			
			let currentPhone = playingClip.indexedPhones[timeIndex];

			playingClip.marker.querySelector('.infobox').innerHTML = currentPhone.phoneme;
			
			if (current.playbackTime == 0 || Math.abs(current.playbackTime - last(playingClip.phones).time) < 1 ) {
				playingClip.marker.setAttribute('data-pitch', pitchPercent(playingClip.medianPitch) || .5);
				playingClip.marker.setAttribute('data-resonance', playingClip.medianResonance || .5);
			} else {
				let isVowel = currentPhone.phoneme && Array.from(currentPhone.phoneme).filter(
					value => ["A", "E", "I", "O", "U", "Y"].includes(value)
				).length > 0;

				if (isVowel && currentPhone.hasOwnProperty('F_stdevs') && 
					currentPhone.F_stdevs[0] &&  currentPhone.F_stdevs[1] && 
					currentPhone.F_stdevs[2] &&  currentPhone.F_stdevs[3]
				) {
					if (currentPhone != null && currentPhone.F[0]  &&isVowel) {
						playingClip.marker.setAttribute('data-pitch', pitchPercent(currentPhone.F[0]));
					}
					if (currentPhone.F_stdevs && isVowel) {
						playingClip.marker.setAttribute('data-resonance', clamp(0, 1, 
							((0.7321428571428571 * currentPhone.F_stdevs[1] 
							+ 0.26785714285714285 * currentPhone.F_stdevs[2] 
							/*+ 0 * currentPhone.F_stdevs[3]*/) + 2) / 4
						));
					}
				}
			}

			this.update(playingClip.marker);
		});
	}

	getClipById(id) {
		for (let marker of $$('.marker')) {
			if (marker.getAttribute('data-id') == id) {
				return marker;
			}
		}
	}

	addMarker(pitch, resonance, label, ratings) {
		let newMarker;
		this.element.querySelector('.overlay').appendChild(
			 newMarker = span(label || ' ', {
				'class': 'marker', 
				'data-pitch': pitch,
				'data-resonance': resonance,
			}, [
				div({'class' : 'infobox'}, ratings == null ? [] : [
					 div({'class':'ratings-bar'}, [
							'strongly-disagree', 'disagree',
							'agree', 'strongly-agree'
						].map((e, i) => span(
							ratings[i] > .14 ? this.percent(ratings[i]) : ' ', 
							{'class': e, style: `width: ${this.percent(ratings[i])}`}
						))
					)
				])
			])
		)
		let vg = this;
		let showDetails = evt => {
			vg.update(newMarker);
		}
		newMarker.addEventListener('mouseover', showDetails);
		newMarker.addEventListener('click', showDetails);
		
		this.update(newMarker);
		
		return newMarker;
	}

	// Set visual positioning of markers and labels
	// to match the values in `data-pitch` and `data-resonance`.
	update(marker) {
		let overlay = marker.parentNode

		let pitch     = parseFloat(marker.getAttribute('data-pitch'));
		let resonance = parseFloat(marker.getAttribute('data-resonance'));

		let translateX = `${Math.round(overlay.clientWidth * resonance)}px`;
		let translateY = `${Math.round(overlay.clientHeight * (1-pitch))}px`;
		let markerTranslateY = `${-Math.round(overlay.clientHeight * pitch)}px`;
		let hairTranslateY = `${Math.round(overlay.clientHeight * (1 - pitch))}px`;
		marker.style.transform = `translate(${translateX}, ${translateY})`;


		// Update the hairlines and labels
		this.xHairline.style.border = '1px solid red';
		
		let previewClip = globalState.get('previewClip');

		if (previewClip && previewClip.marker && marker == previewClip.marker) {
			this.xValueLabel.style.transform = `translate(${translateX}, 0px)`;
			this.yValueLabel.style.transform = `translate(0px, ${markerTranslateY})`; 

			// Doesn't move unless there's a delay
			let hairx = this.xHairline;
			let hairy = this.yHairline;
			setTimeout(() => {
				$('.x.hairline').style.transform = `translate(${translateX}, 0px)`;
				$('.y.hairline').style.transform = `translate(0px, ${hairTranslateY})`;
			}, 1);

			this.xValueLabel.innerHTML = `${Math.round(resonance * 100)}%`;
			this.yValueLabel.innerHTML = `${Math.round(
				this.pitchLowerBoundHz + pitch * this.pitchRange
			)}Hz`;

			this.yHairline.style.opacity = '1';
			this.yValueLabel.style.opacity = '1';
			this.xHairline.style.opacity = '1';
			this.xValueLabel.style.opacity = '1';
		}
	}

	/*
	preview(recordings) {
		for (recording of recordings) {
			let el = document.createElement('div');
			let vg = this;
			el.addEventListener('click', evt => {
				vg.play(recording);
				vg.preview(recordings);
			})
		}
	}
	*/

	/* Color manipulation */
	lighten(color, proportion) {
		return proportion >= 0 
		? { r: color.r + (255 - color.r) * proportion,
			g: color.g + (255 - color.g) * proportion,
			b: color.b + (255 - color.b) * proportion, }
		: { r: color.r - color.r * -proportion,
			g: color.g - color.g * -proportion,
			b: color.b - color.b * -proportion, }
	}
	blend(color1, color2, amount) {
		return {
			r: color1.r * (1 - amount) + color2.r * amount,
			g: color1.g * (1 - amount) + color2.g * amount,
			b: color1.b * (1 - amount) + color2.b * amount,
		}
	}

	percent(x) {
		return Math.floor(x * 100) + '%';
	}
}

for (let graph of document.querySelectorAll('voice-graph-2d')) {
	graph.voiceGraph = new VoiceGraph(graph);
}



