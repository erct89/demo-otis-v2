'use strict';

angular.module('webrtc').factory('Devices', ['Util','Dependencies', function( Util, Dependencies){
	var self = this;
	var mediaDevices = Dependencies.getDependecy("window.navigator.mediaDevices");
	var result = {"devices":[], 
		"constraints": {audio: false, video: false},
		"isSupport": function(){ return y(); }, 
		"loadDevices": function(){return loadDevices();},
		"loadConstraints": function(devices){
			return loadConstraints(devices);
		}
	};


	var isMediaSupport = function(){
		return (mediaDevices !== null && mediaDevices.enumerateDevices && mediaDevices.getSupportedConstraints);
	};

	var loadDevices = function(){
		var allDevices = [];
		result.devices = [];

		if(isMediaSupport()){
			return mediaDevices.enumerateDevices();
		}
	};

	var loadConstraints = function(devices){
		devices = Array.isArray(devices)? devices: null;
		var constraints = {audio: false, video: false};
		
		if(mediaDevices.getSupportedConstraints){ //Restricciones que son soportadas.
			constraints = Util.jsonConcat(constraints, mediaDevices.getSupportedConstraints());
		}

		if(devices){ 
			//Averiguar si tenemos dispositivo para la entrada de audio o video.
			for(let device of devices){
				if(device.kind === 'audioinput'){
					constraints.audio = true
				}else if(device.kind === 'videoinput'){
					constraints.video = true;
				}
			}
		}

		return constraints;
	};

	return result;
}]);