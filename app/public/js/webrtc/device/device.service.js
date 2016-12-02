'use strict'

angular.module('webrtc')
	.factory('Device', ['Util','Dependencies','Devices', 
		function( Util, Dependencies, Devices){
			var self = this;
			var states = ['off','on','using'];

			self.media_stream = null;
			self.state = states[0];
			self.spConstraints = Devices.constraints; // Hash de propiedades que son soportadas.
			self.constraints = {audio: self.spConstraints.audio, video: self.spConstraints.video}; //Establecer las propiedades por defecto.
			self.userMedia = Dependencies.getDependecy("window.navigator.mediaDevices.getUserMedia");

			/*
				checkConstraint(<String>)
					- Description: Comprueba si la propiedad que se le pasa como parametro, 
					es soportada por nuestro equipo.
					> restraints: <Object> Objeto con las restricciones.
					< return: <Boolean> True restriccion soportada, False restriccion no soportada.
			*/
			var checkConstraint = function(property){
				var result = false;

				property = (typeof(property) === 'string')? property: null;
				result = Boolean(self.spConstraints[property]);

				return result;
			};


			/*
				starDevice(constraints)
					- Description: Intenta obtener un nuevo stream segun unas restricciones,
					solo pide el mediaStream si los dispositivos pedidos en constraints son 
					soportados por nuestro equipo, hay soporte para las APIS y no hay ya un 
					mediaStream creado.
			*/
			var startDevice = function (constraints) {
				constraints = (typeof(constraints)==='object')? constraints: {};
				var message;
				return new Promise(function(resolve,reject){
					//Debe existir en al menos una propiedad audio o video
					if( (constraints.audio || constraints.video ) ){
						//Si se ha pedido un stream de audio comprobar que existe soporte para audio
						if( constraints.audio ){
							if( !checkConstraint('audio') ){ //Hay soporte para audio.
								message = 'No support for audio devices';
							}
						}
						//Si se ha pedio un stream de video, comprobar que hay soporte para video.
						if( constraints.video ){
							if( !checkConstraint('video') ){ //Hay soporte para video.
								message = 'No support for video devices';	
							}
						}

						/*
							Comprobar si ya existe un mediaStream y si hay soporte 
							para el dispositivo requerido.
						*/
						if(!self.media_stream && !message){
							self.userMedia(self.constraints)
								.then(function (mediaStream) {
									self.media_stream = mediaStream;
									self.state = states[2];
									resolve(self.media_stream);
								}).catch(function(error){
									reject(error);
								});
						}else{
							message = message || 'There is already a device in use';
							reject(message);
						}
					}else{

					}
				});
			};

			var stopDevice = function () {
				return new Promise(function(resolve,reject){
					if(self.media_stream){
						for(let mST of self.media_stream.getTracks()){
							mST.stop();
						}

						self.media_stream = null;
						self.state = states[0];
						resolve();
					}else{
						reject('Device Info: No exite ningun mediaStream');
					}
				});
			};

			var getMediaStream = function(){
				var result = null;
				
				if(self.media_stream && self.state === 'using'){
					result = self.media_stream;
					self.state = states[2];
				}else{

				}
				
				return result;
			};

			return {
				//setConstraint: function(constraints) { setConstraint(constraints); },
				isVideoSupport: function() { return checkConstraint('video'); },
				isAudioSupport: function() { return checkConstraint('audio'); },
				getConstraint: function() { return self.constranints; },
				getState: function () { return self.state; },
				getMediaStream: function () {return media_stream;},
				start: function(constraints) { return startDevice(constraints); },
				stop: function(){ return stopDevice(); }
			};
		}]);