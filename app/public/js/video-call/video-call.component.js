'use strict'; 

angular.module('videoCall')
	.component('videoCall',{
		templateUrl: 'js/video-call/video-call.template.html',
		controller: ['Dependencies', 'Plataform', 'Records', 'Janus', 'Device', '$sce', '$scope', 
			function(Dependencies, Plataform, Records, Janus, Device, $sce, $scope){ 
				const STATES = { "unsupport": 0, 
						"unregistered": 1, 
						"registered": 2, 
						"available": 3, 
						"engaged": 4, 
						"recording": 5 };

    			const PLUGIN = 'janus.plugin.videocall';

				var self = this;

				self.userName = "Otis";
				self.userCall = "";
				self.SessionId;
				self.PluginHandlerId;
				self.remoteStream;
				self.localStream;

				//1.- Comprobar Soporte.
				self.state = Janus.isSupport() ? STATES.unregistered : STATES.unsupport; 
				self.janusState = Janus.getState();
				

				//
				self.login = function(){
					var message = { "message": {"request": "register", "username": self.userName} };
					
					if(self.userName.length > 0){
						if(self.state === STATES.unregistered && Janus.getPluginHandler()){
							Janus.getPluginHandler().send(message);
							
							self.state = STATES.registered;
						}
					}
				};
				self.call = function() {
					if(self.userCall.length > 0){
						if(self.state > STATES.unregistered && self.state < STATES.engaged){
							//Esto lo puedo mover al servicio.
							Janus.getPluginHandler().createOffer({
								"media": true,
								"success": function(jsep) {
									var message = {
										"message": {
											"request": "call",
											"username": self.userCall,
										}, "jsep": jsep
									};
									console.log("Plugin createOffer success");
									console.log("Recibido JSEP: ");
									console.log(jsep);
									console.log("Envio: ");
									console.log(message);

									Janus.getPluginHandler().send(message);
								},
								"error": function(error) {
									console.log("Plugin createOffer error:");
									console.log(error);
									self.userCall = '';
								} 
							});
							//self.state = STATES.engaged;
						}
					}
				};
				self.hangup = function() {
					if(self.state === STATES.engaged){
						self.state = STATES.available;
					}
				};

				//Envia un mensaje al servidor Janus para recuperar los usuarios
				//conectados al plugin.
				self.listUsers = function(){
					var message = {"message": {"request": "list"}};
					if( self.state === STATES.registered ){
						if(Janus.getPluginHandler){
							Janus.getPluginHandler().send(message);
						}	
					}
				};


				//Interfaz plublica del componente con los botones, que
				//despues desapareceran, puesto que se realizara de forma
				//automatica.
				self.createSession = function() {
					Janus.createSession();
				};
				self.destroySession = function() {
					Janus.destroySession();
				};

				self.attachPlugin = function() {
					Janus.attachToPlugin(PLUGIN).catch(function(error){ console.log(error)});
				};
				self.detachPlugin = function() {
					Janus.detachPlugin();
				}


			//Eventos del Servicio Janus
				//Envento: que captura los errores que surgen en el plugin Janus.
				$scope.$on('onErrorJanus',function(error) {
					console.log(error);
				});


				//Evento: que indica cuando cambia de estado el servicio.
				$scope.$on('onStateChangeJanus', function(event, janusState) {
					console.log('Cambio de estado en Janus > ' + janusState.value);
					self.janusState = janusState.state;
				});


				//Eventos: capturados cuando se inicia, destruye o session una session con Janus.
				$scope.$on('onNewSessionJanus',function() {
					self.SessionId = Janus.getSession().getSessionId();
				});
				$scope.$on('onDestroySessionJanus', function(){
					self.state = STATES.unregistered;
					self.SessionId = '';	
				});

				//Eventos: Estos eventos son lanzados por el plugin de janus.
				// - Conectado al plugin.
				$scope.$on('onAttachPluginJanus',function(event, idHandlerPlugin) {
					self.PluginHandlerId = idHandlerPlugin;
				});
				// - Desconectado del plugin.
				$scope.$on('onDetachPluginJanus',function(event) {
					self.PluginHandlerId = '';
				});
				// - Se obtine un mediaStream remoto.
				$scope.$on('onRemoteStreamPluginJanus', function(event, mStream) {
					self.remoteStream = $sce.trustAsResourceUrl(Records.getBlobURL(mStream));
				});
				// - Se obtine un mediaStream local.
				$scope.$on('onLocalStreamPluginJanus', function(event, mStream) {
					self.remoteStream = $sce.trustAsResourceUrl(Records.getBlobURL(mStream));s
				});
			}]
		});