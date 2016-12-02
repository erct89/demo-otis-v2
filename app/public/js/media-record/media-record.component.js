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
		controller: ['Plataform', 'Records', 'Device', '$sce', '$scope',
			function(Plataform, Records, Device, $sce, $scope){
				var self = this;
				var type = self.type;
				var constraints = {audio: false, video: false};
				var states = ["unsupport","stopped","pause","recording"]; //Estados del Modulo.
				var mimeTypes = Plataform.getMineType()[type]; //Obtener los tipos de archivos compatibles.			
				var recordObject = null; //Actual Objeto Grabado.

				//Preconfiguracion sengun el atributo type de media-record.
				if(type === 'video'){
					constraints = {audio: true, video: true};
					self.state = (Records.isSupport() && Device.isAudioSupport() && Device.isVideoSupport())? states[1]: states[0];
				}else if(type === 'audio'){
					constraints = {audio: true, video: false};
					self.state = (Records.isSupport() && Device.isAudioSupport())? states[1]: states[0];
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
							return Records.createRecord(mStream, {mimeType: mimeTypes});
						}).then(function(record) {
							recordObject = record;
							self.input = $sce.trustAsResourceUrl(Records.getBlobURL(record.mstream));
							recordObject.start();
						}).catch(function(error){
							console.log(error);
						});
				};

				self.pause = function(){
					//1.- Primero comprobar que existe, mediaRecord.
					//2.- Parar mediaRecord.
					//3.- Parar el microfono.
					//4.- Cambiar el estado.
					recordObject.stop();
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
					recordObject.stop();
					recordObject = null;
					changeState(1);
				};

				self.delete = function(index){
					//Borrar el elemento seleccionado del servidor.
					//1.- Obtener el elemento.
					//2.- Crear la url.
					var removeElement = self.recs[index];
					removeElement.delete()
						.then(function(data) {
							self.recs.splice(index,1);
						}).catch(function(error) {
							console.log(error);
						});
				};

				self.save = function(){
					//1.- Anadir la actual grabacion al array de grabaciones.
					//2.- Cambiar el estado del modulo.
					recordObject.save()
						.then(function(data) {
							self.recs.push(recordObject);
							changeState(1);
						}).catch(function(error) {
							console.log(error);
						});
				};

				self.play = function(index){
					var  rec = self.recs[index];
					rec.get()
						.then(function(record) {
							rec = record;
							if(type === 'audio'){
								return rec.getUserMedia();	
							}else if( type === 'video'){
								return rec.blob;
							}
						}).then(function(mstream) {
							self.input = $sce.trustAsResourceUrl(Records.getBlobURL(mstream));
						}).catch(function(error) {
							console.log(error);
						});
				};

				var changeState = function(index){
					self.state = states[index];
				};

				var init = function(){
					Records.get(mimeTypes).then(function (records) {
						self.recs = records;
					}).catch(function(error) {
						console.log(error);
					});
				};

				$scope.$on('onDataavailableRecord',function(event,data){
					changeState(3);
				});
				$scope.$on('onStopRecord', function(event,data){
					changeState(2);
				});

				init();
			}]
	});