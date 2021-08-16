

class VoiceGraph {

	constructor(element) {

		this.element = element;
		this.selectedMarker = null;

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

		this.update();

		window.addEventListener('resize', this.update);
	}

	addMarker(pitch, resonance, label, ratings) {
		let newMarker;
		this.element.querySelector('.overlay').appendChild(
			 newMarker = span(label || ' ', {
				'class': 'marker', 
				'data-pitch': pitch,
				'data-resonance': resonance
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
			vg.selectedMarker = newMarker;
			vg.update();
		}
		newMarker.addEventListener('mouseover', showDetails);
		newMarker.addEventListener('click', showDetails);
		
		vg.selectedMarker = newMarker;
		playingMarker = newMarker;
		this.update();
		
		return newMarker;
	}

	// Set visual positioning of markers and labels
	// to match the values in `data-pitch` and `data-resonance`.
	update() {
		for (let marker of this.element.querySelectorAll('.marker')) {
			let overlay = marker.parentNode

			let pitch     = parseFloat(marker.getAttribute('data-pitch'));
			let resonance = parseFloat(marker.getAttribute('data-resonance'));

			let translateX = `${Math.round(overlay.clientWidth * resonance)}px`;
			let translateY = `${Math.round(overlay.clientHeight * (1-pitch))}px`;
			let markerTranslateY = `${-Math.round(overlay.clientHeight * pitch)}px`;
			let hairTranslateY = `${Math.round(overlay.clientHeight * (1 - pitch))}px`;
			//marker.style.translate = `${translateX} ${translateY}`;
			marker.style.transform = `translate(${translateX}, ${translateY})`;


			// Update the hairlines and labels
			if (marker === this.selectedMarker) {

				this.xHairline.style.border = '1px solid red';
				
				//this.xValueLabel.style.translate = `${translateX} 0px`;
				//this.yValueLabel.style.translate = `0px ${markerTranslateY}`; 
				this.xValueLabel.style.transform = `translate(${translateX}, 0px)`;
				this.yValueLabel.style.transform = `translate(0px, ${markerTranslateY})`; 

				// Doesn't move unless there's a delay
				let hairx = this.xHairline;
				let hairy = this.yHairline;
				setTimeout(() => {
					//$('.x.hairline').style.translate = `${translateX} 0px`;
					//$('.y.hairline').style.translate = `0px ${hairTranslateY}`;
					$('.x.hairline').style.transform = `translate(${translateX}, 0px)`;
					$('.y.hairline').style.transform = `translate(0px, ${hairTranslateY})`;
					console.log($('.y.hairline').style.transform);
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
	}

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



