'use strict';

angular.module('webrtc')
	.factory('Devices', ['Util','Dependencies', function( Util, Dependencies){
		var self = this;
		var mediaDevices = Dependencies.getDependency("window.navigator.mediaDevices");
		var result = {
			"devices":[], 
			"constraints": {audio: false, video: false},
			"isSupport": function(){ return isMediaSupport(); }, 
			"loadDevices": function(){ return loadDevices(); },
			"loadConstraints": function(devices){ return loadConstraints(devices); }
		};

		/*
			isMediaSupport()
				- Description: Retorna un valor booleano que determina si este servicio es 
				soportado o no. Para ello debe soportar el API 'window.navigator.meddiaDevices'.
				< return: <Boolean> True las dependencias son soportada, False no son soportadas.
		*/
		var isMediaSupport = function(){
			return (mediaDevices !== null && mediaDevices.enumerateDevices && mediaDevices.getSupportedConstraints);
		};

		/*
			loadDevices()
				- Descripcion: Obtine una promise que carga los dispositivos.
				< return: <Promise> then(<DevicesInformation>), catch(error)
		*/
		var loadDevices = function(){
			var allDevices = [];
			result.devices = [];

			return new Promise(function(resolve, reject){
				if(isMediaSupport()){
					mediaDevices.enumerateDevices().then(function(DeviceInfo){
						resolve(DeviceInfo);
					}).catch(function(error){
						reject(error);
					});
				}else{
					reject('Devices service unsupport');
				}
			});
		};


		/*
			loadConstraints(<Array <Devices> >)
				- Description: Obtiene la lista de restricciones, que son soportadas y no soportadas.
				> devices: <Array <Devices> > Array de objetos MediaDevicesInfo.
				< return: <Objec> Hash de capacidades soportadas y no de los dispositivos.
		*/
		var loadConstraints = function(devices){
			devices = Array.isArray(devices)? devices: null;
			var constraints = {audio: false, video: false};
			
			if(isMediaSupport()){ //Hay soporte
				constraints = Util.jsonConcat(constraints, mediaDevices.getSupportedConstraints());

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
			}

			return constraints;
		};

		return result;
	}]);