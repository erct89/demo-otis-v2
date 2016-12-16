'use strict'; 

angular.module('webrtc')
	.constant('JANUS_SERVER', [ 
		"https://webrtc.dev.ivrpowers.com:8089/janus", 
		"wss://webrtc.dev.ivrpowers.com:8989"
	]);

angular.module('webrtc')
	.constant('JANUS_ICE_SERVERS', [
		{ url: "turn:numb.viagenie.ca", username: "oscar_vady@hotmail.com", credential: "poctest" },
		{ url: "stun:webrtc.dev.ivrpowers.com:18999" },
		{ url: "stun:stun.l.google.com:19302" }
	]);