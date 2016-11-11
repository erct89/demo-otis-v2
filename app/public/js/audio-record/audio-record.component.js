'use strict'
/*
	La logica que hay que utilizar.
		- Obtener las dependencias.
		- Obtener el mimeType.
		- Obtener las restricciones.
*/
angular.module('audioRecord').component('audioRecord',{
	templateUrl: 'js/audio-record/audio-record.template.html',
	controller: ['Plataform' ,'Record' ,'Device' ,'Util' , '$http','$sce' ,
		function(Plataform, Record, Device, Util, $http, $sce){
			var self = this;
			var states = ["unsupport","stopped","pause","recording"]; //Estados del Modulo.
			var mimeTypes = Plataform.getMineType().audio; //Obtener los tipos de archivos compatibles.			
			var audioObject = null; //Actual Objeto Grabado.

			//Propiedades del modelo.
			self.state = (!Record.isSupport())? states[0]: states[1];
			self.recs = [];
			self.input = '';

			//Funcion de grabación
			self.rec = function(){
				//Pidiendo permiso para el micro.
				//Realizando el encendido con promesas.
				Device.start()
					.then(function(mStream){
						self.input = $sce.trustAsResourceUrl(URL.createObjectURL(mStream));
						Record.createRecord(mStream, {mimeType: mimeTypes.mime});
						Record.start();
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
				Record.stop();
				Device.stop().then(function(){
					console.log('Apagando el dispositivo.');

					self.input = '';
					changeState(2);
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
				//Borrar el elemento seleccionado del array.
				self.recs.splice(index,1);
			};

			self.save = function(){
				//1.- Anadir la actual grabacion al array de grabaciones.
				//2.- Cambiar el estado del modulo.
				audioObject = Record.getRecord();
				audioObject.id = new Date().getTime();
				audioObject.name = Util.generateString('','audio',mimeTypes.subfix,{top:'_',bottom:'.'});
				//Almacenar el objeto.
				self.recs.push(audioObject);
				changeState(1);
			};

			self.play = function(index){
				if(self.state === 'stopped'){
					self.input = $sce.trustAsResourceUrl(self.recs[index].dataUri);
				}
			}

			self.send = function(index){
				var data = self.recs[index];
				var data_send = { name: data.name , blob64: data.blob64};
				$http.post('record/audio', {
						data: data_send,
						headers:{'Content-type':'application/json'}
    				}).then(function(data) {
						console.log(data);
					}).catch(function(error) {
						console.log(error);
					});
			};

			var changeState = function(index){
				self.state = states[index];
			};
		}],
		bindings:{}
	});