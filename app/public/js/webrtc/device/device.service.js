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

			var setConstraint = function(constraints){
				constraints = (typeof(constraints) === 'object')? constraints: null;
				constraints.audio = constraints.audio || self.constraints.audio;
				constraints.video = constraints.video || self.constraints.video;	
				self.constraints = jsonConstraint;
			};

			var startDevice = function () {
				return new Promise(function(resolve,reject){
					if(!self.media_stream){
						self.userMedia(self.constraints)
							.then(function (mediaStream) {
								self.media_stream = mediaStream;
								self.state = states[2];
								resolve(self.media_stream);
							}).catch(function(error){
								reject(error);
							});
					}else{
						reject('Device Info: Ya exite un mediaStream.');
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
				setConstraint: function(constraints) { setConstraint(constraints); },
				getConstraint: function() { return self.constranints; },
				getState: function () { return self.state; },
				getMediaStream: function () {return media_stream;},
				start: function() { return startDevice(); },
				stop: function(){ return stopDevice(); }
			};
		}]);