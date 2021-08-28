

function loadDefaultClips() {
	fetch('./resources/charlotte.json').then(response => response.json()).then(clip => {
		for (let existingClip of globalState.get('clips')) {
			if (existingClip.id == clip.id) return;
		}
		globalState.mutate('clips', clips => clips.push(clip));
		globalState.set('previewClip', clip);
		globalState.set('playingClip', clip);
	});

	for (let name of ['charlotte', 'quinn', 'lucy', 'morgan', 'fern', 'bob', 'lesley']) {
		fetch(`./resources/${name}.json`).then(response => response.json()).then(clip => {
			for (let existingClip of globalState.get('clips')) {
				if (existingClip.id == clip.id) return;
			}
			globalState.mutate('clips', clips => clips.push(clip));
		});
	}
}
function loadExtendedClips() {
	for (let name of [
		'jenn', 'chuck', 'steve', 'david', 'aiden', 'zoe', 
		'luna', 'leonard', 'kristen', 'wina', 'chris'
	]) {
		fetch(`./resources/${name}.json`).then(response => response.json()).then(clip => {
			for (let existingClip of globalState.get('clips')) {
				if (existingClip.id == clip.id) return;
			}
		      globalState.mutate('clips', clips => clips.push(clip));
		});
	}
}
