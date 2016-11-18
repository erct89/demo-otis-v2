'use strict'

angular.module('mediaRecord')
	.component('mediaRecord',{
		templateUrl: ['$element','$attrs', function($element,$attrs) {
				$attrs.type = ($attrs.type === 'video' || $attrs.type === 'audio')? $attrs.type: 'default';
				$element.class += " mr-"+$attrs.type;
				return  'js/media-record/' + $attrs.type + '-record.template.html';
			}],
		bindings:{
				type: '@',
			},
		controller: ['Plataform', 'Record', 'Device', 'Util', '$http', '$sce', '$scope',
			function(Plataform, Record, Device, Util, $http, $sce, $scope){
				var self = this;
				var type = self.type;
				var constraints = {audio: false, video: false};
				var states = ["unsupport","stopped","pause","recording"]; //Estados del Modulo.
				var mimeTypes = Plataform.getMineType()[type]; //Obtener los tipos de archivos compatibles.			
				var recordObject = null; //Actual Objeto Grabado.

				//Preconfiguracion sengun el atributo type de media-record.
				if(type === 'video'){
					constraints = {audio: true, video: true};
					self.state = (Record.isSupport() && Device.isAudioSupport() && Device.isVideoSupport())? states[1]: states[0];
				}else if(type === 'audio'){
					constraints = {audio: true, video: false};
					self.state = (Record.isSupport() && Device.isAudioSupport())? states[1]: states[0];
				}

				//Propiedades del modelo.
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
					var url = 'record/'+ type +'/' + removeElement.id;

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
					recordObject = Record.getRecord();
					recordObject.id = new Date().getTime();
					recordObject.name = Util.generateString('',type,mimeTypes.subfix,{top:'_',bottom:'.'});
					recordObject.dataUri = $sce.valueOf($sce.trustAsResourceUrl(recordObject.dataUri));
					//3.- Enviar el audio al servidor.

					console.log(recordObject);
					send(recordObject);

					//Almacenar el objeto.
					self.recs.push(recordObject);
					changeState(1);
				};

				self.play = function(index){
					var url = 'record/'+ type +'/' + self.recs[index].id;

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
							$http.post('record/' + type, {
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
					$http.get('record/' + type).then(function(data) {
						//Creamos los objetos recs, con el id y el nombre del fichero.
						for(let file of data.data[type]){
							let recordObject = {};
							recordObject.id = file.match(/(\d){13}/g)[0];
							recordObject.name = file;
							self.recs.push(recordObject);
						}

						self.concat();
					}).catch(function(error){
						console.log(error);
					});
				};

				self.concat = function(){
					$http.post('record/concat/audio',{
						data: ['audio_1479126982406.opus','audio_1479128369751.opus']
					}).then(function(data) {
						console.log(data);
					}).catch(function(err) {
						console.log(err);
					});
				}

				$scope.$on('onRecordDataavailable',function(event,data){
					changeState(3);
				});
				$scope.$on('onRecordStop', function(event,data){
					changeState(2);
				});

				init();
			}]
	});