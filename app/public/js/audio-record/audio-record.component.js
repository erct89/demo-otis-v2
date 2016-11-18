'use strict'
/*
	La logica que hay que utilizar.
		- Obtener las dependencias.
		- Obtener el mimeType.
		- Obtener las restricciones.
*/
angular.module('audioRecord').component('audioRecord',{
	templateUrl: 'js/audio-record/audio-record.template.html',
	controller: ['Plataform', 'Record', 'Device', 'Util', '$http', '$sce', '$scope',
		function(Plataform, Record, Device, Util, $http, $sce, $scope){
			var self = this;
			var states = ["unsupport","stopped","pause","recording"]; //Estados del Modulo.
			var constraints = {audio: true, video: false};
			var mimeTypes = Plataform.getMineType().audio; //Obtener los tipos de archivos compatibles.			
			var audioObject = null; //Actual Objeto Grabado.

			//Propiedades del modelo.
			self.state = (Record.isSupport() && Device.isAudioSupport())? states[1]: states[0];
			self.recs = [];
			self.input = '';

			//Funcion de grabación
			self.rec = function(){
				//Pidiendo permiso para el micro.
				//Realizando el encendido con promesas.
				Device.start(constraints)
					.then(function(mStream){
						self.input = $sce.trustAsResourceUrl(URL.createObjectURL(mStream));
						Record.createRecord(mStream, {mimeType: mimeTypes.mime});
						Record.start();
					}).catch(function(error){
						console.log(error);
					});
			};

			self.pause = function(){
				//1.- Primero comprobar que existe, mediaRecord.
				//2.- Parar mediaRecord.
				//3.- Parar el microfono.
				//4.- Cambiar el estado.
				Record.stop();
				Device.stop().then(function(){
					console.log('Apagando el dispositivo.');

					self.input = '';
				}).catch(function(error){
					console.log('Error on stop: ' + error);
				});
			};

			self.cancel = function(){
				//1.- Comprobar que existe mediaRecord.
				//2.- Borrar el mediaRecord.
				//3.- Cambiar el estado.
				Record.stop();
				changeState(1);
			};

			self.delete = function(index){
				//Borrar el elemento seleccionado del servidor.
				//1.- Obtener el elemento.
				//2.- Crear la url.
				var removeElement = self.recs[index];
				var url = 'record/audio/' + removeElement.id;

				$http.delete(url,{
						headers:{'Content-type':'application/json'}, 
						data:removeElement
					}).then(function(res){
						console.log(res);
						self.recs.splice(index,1);	
					}).catch(function(error){
						console.log(error);
					});
			};

			self.save = function(){
				//1.- Anadir la actual grabacion al array de grabaciones.
				//2.- Cambiar el estado del modulo.
				audioObject = Record.getRecord();
				audioObject.id = new Date().getTime();
				audioObject.name = Util.generateString('','audio',mimeTypes.subfix,{top:'_',bottom:'.'});
				audioObject.dataUri = $sce.valueOf($sce.trustAsResourceUrl(audioObject.dataUri));
				//3.- Enviar el audio al servidor.

				console.log(audioObject);
				send(audioObject);

				//Almacenar el objeto.
				self.recs.push(audioObject);
				changeState(1);
			};

			self.play = function(index){
				var url = 'record/audio/' + self.recs[index].id;

				$http.get(url).then(function(data) {
					var blob = Record.b64ToBlob(data.data, mimeTypes.mime);
					self.input = $sce.trustAsResourceUrl(URL.createObjectURL(blob));
				}).catch(function(error) {
					console.log(error);
				});
			};

			//Enviar un audio al servidor.
			var send = function (audio){
				audio = typeof(audio)==='object'?audio:null;

				if(audio){
					var data_send = { name: audio.name , blob64: audio.blob64};

					if(data_send.name && data_send.blob64){
						$http.post('record/audio', {
								data: data_send,
								headers:{'Content-type':'application/json'}
	    					}).then(function(data) {
								console.log(data);
							}).catch(function(error) {
								console.log(error);
							});
					}else{
						console.log("El argumento pasado es incorrecto.");
					}
				}else{
					console.log("El argumento pasado es incorrecto.");
				}
			};

			var changeState = function(index){
				self.state = states[index];
			};

			var init = function(){
				$http.get('record/audio').then(function(data) {
					//Creamos los objetos recs, con el id y el nombre del fichero.
					for(let file of data.data.audio){
						let audioObject = {};
						audioObject.id = file.match(/(\d){13}/g)[0];
						audioObject.name = file;
						self.recs.push(audioObject);
					}
				}).catch(function(error){
					console.log(error);
				});
			};


			$scope.$on('onRecordDataavailable',function(event,data){
				changeState(3);
			});
			$scope.$on('onRecordStop', function(event,data){
				changeState(2);
			});

			init();
		}],
		bindings:{}
	});