

class Phone {
	constructor() {
		this.time = null;
		this.phoneme = null;
	}
}

class Clip {
	constructor() {
		this.audio = null; // data url for audio
		this.phones = [];
		this.indexedPhones = [];
		this.meanPitch = null;  // Number
		this.meanResonance = null;  // Number
		this.id = null;
		this.marker = null; // Element
		this.transcript = null;
	}
	loadAudioFile(file) {
		let reader = new FileReader(file);	
		reader.readAsDataURL(file);
		reader.addEventListener("load", () => {
			this.audio = reader.result.replace(
				/data:.*;base64/, 
				"data:audio/wav;base64"
			);
			this.id = hash(this.audio);
		});
	}
	loadResponse(data) {
		this.phones = data.phones;
		this.meanPitch = data.meanPitch;
		this.meanResonance = data.meanResonance;
		this.medianPitch = data.medianPitch;
		this.medianResonance = data.medianResonance;
		this.stdevPitch = data.stdevPitch;
		this.stdevResonance = data.stdevResonance;

		this.indexedPhones = Array(Math.ceil(last(this.phones).time * 100));
		for (let phone of data.phones) {
			this.indexedPhones[Math.floor(phone.time * 100)] = phone;
		}
		
		// Fill in missing values with what came before
		for (let i = 0; i < this.indexedPhones.length; i++) {
			if (!this.indexedPhones[i]) {
				if (this.indexedPhones[i - 1]) {
					this.indexedPhones[i] = this.indexedPhones[i - 1];
				} else {
					throw 'First data point is undefined';
				}
			}
		}
	}
}
