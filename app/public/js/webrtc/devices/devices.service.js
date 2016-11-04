'use strict';

angular.module('webrtc').factory('Devices', ['Util', '$window', function( Util, $window){
	var self = this;
	var result = {"devices":[], 
		"isSupport": function(){ return isMediaSupport(); }, 
		"loadDevices": function(){return loadDevices();}
	};

	var mediaDevices = Util.getPropertyForFullName($window,["window","navigator","mediaDevices"]);

	var isMediaSupport = function(){
		return (mediaDevices !== null);
	};

	var loadDevices = function(){
		var allDevices = [];
		result.devices = [];

		if(isMediaSupport()){
			return mediaDevices.enumerateDevices();
		}
	};

	return result;
}]);