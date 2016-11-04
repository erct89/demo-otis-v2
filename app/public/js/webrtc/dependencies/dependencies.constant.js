'use strict'; 

angular.module('webrtc')
	.constant('DEPENDECIES', [
		"window.URL",
		"window.URL.createObjectURL",
		"window.RTCPeerConnection",
		"window.MediaRecorder",
		"window.MediaStream",
		"window.MediaStreamTrack",
		"window.getUserMedia",
		"window.navigator",
		"window.navigator.mediaDevices",
		"window.navigator.mediaDevices.getUserMedia",
		"window.navigator.mediaDevices.enumerateDevices",
		"window.navigator.getUserMedia"]);