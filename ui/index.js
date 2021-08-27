
window.onresize = evt => {
	if (window.innerWidth / window.innerHeight > 1.4) {
		document.body.classList.remove('narrow-body');
		document.body.classList.add('wide-body');
	} else {
		document.body.classList.add('narrow-body');
		document.body.classList.remove('wide-body');
	}
}
window.onload = window.onresize;

$('button.details').click();

fetch('./resources/high-dark.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
	globalState.set('playingClip', clip);
	globalState.set('previewClip', clip);
});
