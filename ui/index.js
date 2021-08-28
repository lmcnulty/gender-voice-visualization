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
$('.play-pause').focus();

$('button.details').click();

/*fetch('./resources/jenn.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
	globalState.set('playingClip', clip);
	globalState.set('previewClip', clip);
});*/
fetch('./resources/charlotte.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
	globalState.set('playingClip', clip);
	globalState.set('previewClip', clip);
});
fetch('./resources/quinn.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
});
fetch('./resources/lucy.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
});
//fetch('./resources/chuck.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
fetch('./resources/morgan.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
});
fetch('./resources/fern.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
});
fetch('./resources/bob.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
});
//fetch('./resources/steve.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
/*fetch('./resources/david.json').then(response => response.json()).then(clip => {
	globalState.mutate('clips', clips => clips.push(clip));
});*/
//
//fetch('./resources/aiden.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
//
//fetch('./resources/zoe.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
//
//fetch('./resources/lesley.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
//fetch('./resources/luna.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
//fetch('./resources/leonard.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
//fetch('./resources/kristen.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});
///*fetch('./resources/wina.json').then(response => response.json()).then(clip => {
//	globalState.mutate('clips', clips => clips.push(clip));
//});*/

