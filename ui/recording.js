
/*
// record from their microphone in-browser,
let mediaRecorder = null;
let audioChunks = [];
function recordAudio() {
	let stopButton = document.querySelector("#stop-recording");
	let startButton = document.querySelector("#start-recording");

	const startRecording = () => {
		stopButton.disabled = false;
		startButton.disabled = true;
		audioChunks = [];
		mediaRecorder.start();
		mediaRecorder.addEventListener("dataavailable", event => {
			audioChunks.push(event.data);
		});
	}

	if (mediaRecorder) { startRecording(); } else {
		navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
			
			mediaRecorder = new MediaRecorder(stream);
			
			mediaRecorder.addEventListener("stop", () => {
				stopButton.disabled = true;
				startButton.disabled = false;
				const audioBlob = new Blob(audioChunks);
				submitRecording(audioBlob);
			});
			stopButton.addEventListener("click", () => {mediaRecorder.stop();}, false);
			startRecording();
		});
	}
}
*/
