
//let playingData;

// List of values indexed by 1/100 of milliseconds.
// Faster to retreieve because array access is O(1).
//let timedPlayingData = [];  

let globalState = new StateManager();

globalState.init('playingClip', null);
globalState.init('clips', []);
globalState.init('playbackTime', 0);

/*
globalState.init('windowSize', {
	height: window.innerHeight,
	width: window.innerWidth
})

window.addEventListener('resize', evt => {
	globalState.set('windowSize', {
		height: window.innerHeight,
		width: window.innerWidth
	})
});
*/
