
let $ = s => document.querySelector(s);
let $$ = s => document.querySelectorAll(s);

// Player

let mediaElement = $('video.clip');
let playPauseButton = $('button.play-pause');
let progressBar = $('progress.player');

function setSource(src) {
		mediaElement.src = src;
		mediaElement.addEventListener('loadedmetadata', evt => {
				progressBar.setAttribute('max', mediaElement.duration);
				progressBar.setAttribute('value', 0);
		})
}

playPauseButton.addEventListener('click', evt => {
		if (mediaElement.paused || mediaElement.ended) {
				mediaElement.play();
				playPauseButton.classList.add('playing') ;
		} else {
				mediaElement.pause();
				playPauseButton.classList.remove('playing') ;
		}
});

mediaElement.addEventListener('timeupdate', evt => {
		progressBar.setAttribute('value', mediaElement.currentTime);
		if (mediaElement.currentTime >= progressBar.max) {
				playPauseButton.classList.remove('playing');
		}
})

progressBar.addEventListener('click', evt => {
		let pos = (evt.pageX  - progressBar.offsetLeft) / progressBar.offsetWidth;
		mediaElement.currentTime = pos * mediaElement.duration;
})
let dragInProgress = false;
progressBar.addEventListener('mousedown', evt => dragInProgress = true);
progressBar.addEventListener('mouseup', evt => dragInProgress = false);
progressBar.addEventListener('mousemove', evt => {
		if (dragInProgress) {
				let pos = (evt.pageX  - progressBar.offsetLeft) / progressBar.offsetWidth;
				progressBar.value = pos * mediaElement.duration;
		}

})


$('button.settings').addEventListener('click', evt => {
		$('.modal').appendChild($('section.settings'));
		$('.modal-shadow').classList.remove('hidden');
});
$('button.help').addEventListener('click', evt => {
		$('.modal').appendChild($('section.help'));
		$('.modal-shadow').classList.remove('hidden');
});
$('button.new-clip').addEventListener('click', evt => {
		$('.modal').appendChild($('section.new-clip'));
		$('.modal-shadow').classList.remove('hidden');
});
$('button.details').addEventListener('click', evt => {
		$('.modal').appendChild($('section.details'));
		$('.modal-shadow').classList.remove('hidden');
});
$('.modal > .close').addEventListener('click', evt => {
		$('.modal-shadow').classList.add('hidden');
		for (let section of $$('.modal > section')) {
				$('#offscreen').appendChild(section);
		}
});



setSource('./clip.mp3');
