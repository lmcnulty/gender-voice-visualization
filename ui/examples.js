
function loadNextClip(names) {
	if (names.length > 0) {
		fetch(`./resources/${names.pop()}.json`).then(response => response.json()).then(clip => {
			for (let existingClip of globalState.get('clips')) {
				if (existingClip.id == clip.id) return;
			}
			globalState.mutate('clips', clips => clips.push(clip));
			loadNextClip(names);
		});
	}
}


function loadDefaultClips() {
	let defaultClips = ['quinn', 'charlotte', 'jenn', 'lucy', 'bob', 'morgan'].reverse();

	fetch('./resources/all.json').then(response => response.json()).then(clip => {
		for (let existingClip of globalState.get('clips')) {
			if (existingClip.id == clip.id) return;
		}
		globalState.mutate('clips', clips => clips.push(clip));
		globalState.set('previewClip', clip);
		globalState.set('playingClip', clip);
		loadNextClip(defaultClips);
	});

}
function loadExtendedClips() {
	let extendedClips = [
		'fern', 'lesley', 'chuck', 'steve', 'david', 'aiden', 'zoe', 
		'luna', 'leonard', 'kristen', 'wina', 'chris'
	].reverse();
	loadNextClip(extendedClips);
}
