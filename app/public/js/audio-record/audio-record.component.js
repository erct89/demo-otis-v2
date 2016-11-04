'use strict'
/*
	La logica que hay que utilizar.
		- 1. Comporbar que existe las librerias y funciones necesarios,
		en este caso son getUserMedia.
		- 2. 
*/
angular.module('audioRecord').component('audioRecord',{
	templateUrl: 'js/audio-record/audio-record.template.html',
	controller: ['LxDialogService','Dependencies','Util','$sce',
		function(LxDialogService, Dependencies, Util,$sce){
			var self = this;
			var states = ["unsupport","stopped","pause","recording"];
			var mimeTypes = [{mime: 'audio/ogg', subfix:'oga'}, {mime:'audio/webm;codecs="opus"', subfix:'opus'}];

			//Lista de dependecias.
			var userMedia = Dependencies.getDependecy("window.navigator.mediaDevices.getUserMedia"); 
			var MRecord = Dependencies.getDependecy("window.MediaRecorder");
			var URL = Dependencies.getDependecy("window.URL");
			var fReader = Dependencies.getDependecy("window.FileReader");

			var audioObject = null;
			var mediaRecorder = null;
			var chuncks = [];
			var mediaStream = null;

			//Propiedades del modelo.
			self.state = (userMedia === null || MRecord === null )? states[0]: states[1];
			self.recs = [];
			self.input = '';

			//Funcion de grabación
			self.rec = function(){
				var restricciones = {"audio":true, "video":false};
				//Pidiendo permiso para el micro.
				//Realizando el encendido con promesas.
				userMedia(restricciones)
					.then(function(mStream){
						mediaStream = mStream;
						self.input = $sce.trustAsResourceUrl(URL.createObjectURL(mediaStream));
						//Ya tengo el dispositivo multimedia y su flujo de datos ahora hay que guardarlo.
						mediaRecorder = new MRecord(mediaStream); //Creando el mediaRecorder, pasandole el stream.
						mediaRecorder.start(10); 

						mediaRecorder.ondataavailable = function(event){
							console.log('<p>Data available ...</p>');
							
							if(event.size !== 0){
								var reader = new fReader();
							    //File reader is for some reason asynchronous
							    reader.onloadend = function () {
							      console.log(reader.result);
							    }
							    //This starts the conversion
							    reader.readAsBinaryString(event.data);

								chuncks.push(event.data);
							}
						}
						mediaRecorder.onerror = function(error){
							console.log('Error: ' + error);

						}
						mediaRecorder.onstart = function(event){
							console.log('Start & state: '+ mediaRecorder.state);
						}
						mediaRecorder.onstop = function(){
							console.log('Stopped $ state: '+ mediaRecorder.state);

							var recordO = {};
							recordO.blob = new Blob(chuncks,{type: mimeTypes[0].mime});
							recordO.dataUri = URL.createObjectURL(recordO.blob);
							recordO.id = new Date().getTime();
							recordO.name = Util.generateString('','audio',mimeTypes[0].subfix,{top:'_',bottom:'.'});
							
							audioObject = recordO;
							chuncks = [];

							mediaRecorder = null;
						}
						mediaRecorder.onpause = function () {
							console.log("Pause & state: "+ mediaRecorder.state);
						}
						mediaRecorder.onresume = function(){
							console.log('Resumed  & state = ' + mediaRecorder.state);
						}

						mediaRecorder.onwarning = function(warning){
							console.log('Warning: ' + warning);
						}
						changeState(3);
					}).catch(function(error){
						console.log(error);
					});
			};
			self.pause = function(){
				//1.- Primero comprobar que existe, mediaRecord.
				//2.- Parar mediaRecord.
				//3.- Parar el microfono.
				//4.- Cambiar el estado.
				mediaRecorder.stop();
				if(mediaStream){
					console.log('Apagando la camara...');
					
					self.input = '';

					for(var mST of mediaStream.getTracks()){
						mST.stop();
					}
					
					mediaStream = null;
				}else{
					console.log('No se ha recibido ningun MediaStream');
				}

				changeState(2);
			};
			self.cancel = function(){
				//1.- Comprobar que existe mediaRecord.
				//2.- Borrar el mediaRecord.
				//3.- Cambiar el estado.
				mediaRecorder = null;
				changeState(1);
			};
			self.delete = function(){
			};
			self.save = function(){
				//1.- Anadir la actual grabacion al array de grabaciones.
				//2.- Cambiar el estado del modulo.
				self.recs.push(audioObject);
				changeState(1);
			};
			self.send = function(){};

			var changeState = function(index){
				self. state = states[index];
			};

		}],
		bindings:{}
	});