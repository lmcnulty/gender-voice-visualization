
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

player.setSource('./resources/clip.mp3');
$('button.details').click();


