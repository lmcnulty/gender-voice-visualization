
const resizeEvent = evt => {
	if (window.innerWidth / window.innerHeight > 1.4) {
		document.body.classList.remove('narrow-body');
		document.body.classList.add('wide-body');
	} else {
		document.body.classList.add('narrow-body');
		document.body.classList.remove('wide-body');
	}
	let vgEl = $('voice-graph-2d');
	let vgParent = vgEl.parentNode;
	vgEl.style.maxWidth = getComputedStyle(vgParent).height;
}

window.onload = resizeEvent;
window.addEventListener('resize', resizeEvent);

$('.play-pause').focus();

$('button.details').click();

for (let el of $$('textarea, input')) {
	el.addEventListener('focusin', resizeEvent);
	el.addEventListener('focusout', resizeEvent);
}

loadDefaultClips();
