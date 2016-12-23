'use strict'; 

angular.module('videoCall')
	.component('videoCall',{
		templateUrl: 'js/video-call/video-call.template.html',
		controller: ['JANUS_SERVER', 'JANUS_ICE_SERVERS', 'Dependencies', 'Plataform', 'Records', 'Device', '$sce', '$scope', 
			function(JANUS_SERVER, JANUS_ICE_SERVERS, Dependencies, Plataform, Records, Device, $sce, $scope){ 
				const STATES = { "unsupport": 0, "0": "unsupport", "unconected": 1, "1": "unconected", 
						"unplugging": 2, "2": "unplugging",	"unregistered": 3, "3": "unregistered",
						"available": 4, "4": "available", "calling": 5, "5": "calling",
						"speking": 6, "6": "speking", "engaged": 7, "7": "engaged"};

    			const PLUGIN = 'janus.plugin.videocall';
    			const MESSAGES_PLUGIN = {
    				"list": { "message": { "request": "list" }}, 
    				"register": {},
    				"accept": {"message":{ "request":"accept" }, "jsep":null}
    			};

				var self = this;
				var Janus = Dependencies.getDependency('window.Janus');
				var janus_session = null;
				self.userName = "Otis";
				self.userCall = "";
				self.contacts;
				self.session_id;
				self.plugin_id;
				self.remoteStream;
				self.localStream;

				//1.- Comprobar Soporte.
				self.state = Janus.initDone ? STATES.unconected : STATES.unsupport; 
				//self.janusState = Janus.getState();
				
							//Funciones|Metodos pirvados
				/*
					_stateChange(newState)
						- Description: Se encarga de lanzar un evento onStateChangeJanus cada vez 
							que se realice un verdadero, cambio de estado, en la aplicacion.
						> newState: <STATES> valor numerico que se corresponde con un numero que representa un 
							estado de la aplicacion.
				*/
				var _stateChange = function(newState){
					newState = Number(newState);
					
					if(STATES[newState]){
						if(self.state !== newState){
							self.state = newState;
						}
					}
				};

				//Interfaz plublica del componente con los botones, que
				//despues desapareceran, puesto que se realizara de forma
				//automatica.
				self.createSession = function() {
					console.log("Create Session {");

					if(janus_session){ //Hay una instacia de session.
						if(!janus_session.isConnected()){ //No hay conexion.
							console.log("Trace: No hay connexion pero existe la instacia.");

							self.session_id = self.plugin_id = janus_session = null;
							_stateChange(STATES.unconected);
						}
					}else{//Ya debe de existe una session
						janus_session = new Janus({
							server: JANUS_SERVER, //'https://janus.conf.meetecho.com/janus', 
							iceServers: JANUS_ICE_SERVERS,
							success: function() {
								self.session_id = janus_session.getSessionId();
								_stateChange(STATES.unplugging);

								console.log("Session success.");
							}, error: function( error ) {
								self.session_id = self.plugin_id = janus_session = null; 
								_stateChange(STATES.unconected);
								
								console.log('Session error:');
								console.log(error); 
							}, destroyed: function() {
								self.session_id = self.plugin_id = janus_session = null; 
								_stateChange(STATES.unconected);

								console.log("Session destroyed."); 
							}
						});
					}
					console.log("}");
				};


				self.destroySession = function() {
					if(janus_session){
						if(janus_session.isConnected()){
							janus_session.destroy();
						}
					}else{
						self.session_id = self.plugin_id = janus_session = null;
						_stateChange(STATES.unconected);
					}
				};

				self.attachPlugin = function() {
					console.log("Attach plugin: {");
					
					if(janus_session){
						if(janus_session.isConnected()){
							if(!janus_session.plugin){
								janus_session.attach({
									plugin: PLUGIN,
									success: function(pluginHandler){
										janus_session.plugin = pluginHandler;
										self.plugin_id = pluginHandler.getId();
										_stateChange(STATES.unregistered);

										console.log("Attach success.");
									}, error: function(error){
										self.plugin_id = null;
										_stateChange(STATES.unplugging);

										console.log("Attach error: ");
										console.log(error);
									}, consentDialog: function() {
										console.log("Attach consentDialog:");
										console.log(arguments);
									}, onmessage: function(message, jsep){
										console.log("Attach onmessage:");
										console.log(arguments);

										if(message.result){
											if(message.result.list){
												self.userCall = null;
												self.contacts = message.result.list.filter(function(item){ return item != self.userName; });
												setTimeout(function() { janus_session.plugin.send(MESSAGES_PLUGIN.list) }, 5000);

												console.log("Trace message: List ");
												console.log(self.contacts);
												console.log(message.result.list);
											}else if(message.result.event){
												console.log("Trace message: Event ");
												switch(message.result.event){
													case 'registered':
														self.contacts = self.userCall = null;
														janus_session.plugin.send(MESSAGES_PLUGIN.list);
														
														_stateChange(STATES.available);
														console.log("Trace message: event registered");
														break;
													case 'calling':
														_stateChange(STATES.calling);
														console.log("Trace message: event calling");
														break;
													case 'incomingcall':
														self.userCall = message.result.username || 'Anonymous';
														janus_session.plugin.createAnswer({
															jsep: jsep,
															media: { audio: true, 
																video:false,
																data: true},
															success: function(jsep) {
																var request = MESSAGES_PLUGIN.accept.jsep = jsep; 
																janus_session.plugin.send(request);
																_stateChange(STATES.speking);

																console.log("Trace message: event incomingcall answer accept.");
															}, error: function(error) {
																self.localStream = self.remoteStream = null
																self.userCall = null;
																_stateChange(STATES.available);
																
																console.log("Error message: event incomingcall answer error");
																console.log(error);
															}
														});
														
														console.log("Trace message: event incomingcall");
														break;
													case 'accepted':
														self.username = message.result.username || 'Anonymous';
														if(jsep){
															janus_session.plugin.handleRemoteJsep({jsep: jsep});
														}
														_stateChange(STATES.speking);

														console.log("Trace message: event accepted.");
														break;
													case 'hangup':
														self.contacts = self.userName = null;
														self.localStream = self.remoteStream = null;
														janus_session.plugin.hangup();
														_stateChange(STATES.available);

														console.log("Trace message: event hangup.");
														break;
													default:
														console.log("Trace message: event " +message.result.event+ " unsuported.");
														break;
												}
											}else{
												console.log("Trace message: No support.");
											}
										}else{
											if(message.error){
												console.log('Error message: Se ha recibido un mensaje de error.');
												console.log(message.error);
											}
										}
									}, onlocalstream: function(mediaStream){
										self.localStream = mediaStream;
										console.log("Attach onlocalstream:");
										console.log(arguments);
									}, onremotestream: function(mediaStream){
										self.remoteStream = mediaStream;
										console.log("Attach onremotestream:");
										console.log(arguments);
									}, ondataopen: function(args){
										console.log("Attach ondataopne:")
										console.log(arguments);
									}, ondata: function(args){
										console.log("Attach ondata:");
										console.log(arguments);
									}, oncleanup: function(args){
										self.plugin_id = null;
										self.userCall = null;
										self.localStream = self.remoteStream = null;
										delete janus_session.plugin;
										_stateChange(STATES.unplugging);

										console.log("Attach oncleanup:");
										console.log(args);
									}
								});
							}
						}else{
							console.log("Trace: No podemos adjuntar un plugin sino hay session.");

							self.session_id = self.plugin_id = janus_session = null;
							_stateChange(STATES.unconected);
						}
					}else{
						console.log("Trace: No podemos adjuntar un plugin sino hay session.");

						self.session_id = self.plugin_id = janus_session = null;
						_stateChange(STATES.unconected);
					}
					console.log("}");
				};
				
				self.detachPlugin = function() {
					console.log("Detach plugin: {");
					if(janus_session){
						if(janus_session.isConnected()){
							if(janus_session.plugin){
								janus_session.plugin.detach();
								self.plugin_id = null;
								self.userCall, self.contacts = null ;

								_stateChange(STATES.unplugging);
							}else{
								self.plugin_id = null;
								self.userCall, self.contacts = null;
								
								_stateChange(STATES.unplugging);
								console.log("Trace: detach no exite un plugin.");
							}
						}else{
							self.plugin_id = null;
							_stateChange(STATES.unplugging);
							console.log("Trace: detach no existe conexion a la session.");
						}
					}else{
						self.plugin_id = null;
						_stateChange(STATES.unplugging);
						console.log("Trace: detach no exite session.");
					}
					console.log("}");
				}


				//
				self.login = function(){
					var message = { "message": {"request": "register", "username": self.userName} };
					
					console.log("Register user: {");
					if(self.userName.length > 0){
						if(janus_session){
							if(janus_session.isConnected()){
								janus_session.plugin.send(message);
							}else{
								console.log("Trace: register user: No session connecter.");
								_stateChange(STATES.unconected);
							}
						}else{
							console.log("Trace: register user: No session.");
							_stateChange(STATES.unconected);
						}
					}else{
						console.log("Trace: register user: No user.");
						_stateChange(STATES.unregistered);
					}
					console.log("}");
				};
				/*
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
						if(Janus.getPluginHandler){
							Janus.getPluginHandler().send({"message": hangup});
							Janus.getPluginHandler().hangup();
						}
					}
				};*/

				//Envia un mensaje al servidor Janus para recuperar los usuarios
				//conectados al plugin.
				/*self.listUsers = function(){
					var message = {"message": {"request": "list"}};
					if( self.state === STATES.registered ){
						if(Janus.getPluginHandler){
							Janus.getPluginHandler().send(message);
						}	
					}
				};*/


			


			/*
			//Eventos del Servicio Janus
				//Envento: que captura los errores que surgen en el plugin Janus.
				$scope.$on('onErrorJanus',function(event,error) {
					console.log("event: " + event.name );
					console.log(error);
				});


				//Evento: que indica cuando cambia de estado el servicio.
				$scope.$on('onStateChangeJanus', function(event, janusState) {
					console.log("event: " + event.name );
					console.log('Cambio de estado en Janus > ' + janusState.value);
					self.janusState = janusState.state;
				});


				//Eventos: capturados cuando se inicia, destruye o session una session con Janus.
				$scope.$on('onNewSessionJanus',function(event) {
					console.log("event: " + event.name );
					self.SessionId = Janus.getSession().getSessionId();
				});
				$scope.$on('onDestroySessionJanus', function(event){
					console.log("event: " + event.name );
					_stateChange(STATES.unregistered);
					self.SessionId = '';	
				});

				//Eventos: Estos eventos son lanzados por el plugin de janus.
				// - Conectado al plugin.
				$scope.$on('onAttachPluginJanus',function(event, handlerPlugin) {
					console.log("event: " + event.name );
					self.PluginHandlerId = handlerPlugin.id;

					handlerPlugin.use('result.list', function(contacts){
						contacts = Array.isArray(contacts) ? contacts: [];
						self.contacts = contacts;

						for(let contact in self.contacts){
							if(self.contacts[contact] === self.userName){
								self.contacts.splice(contact,1);
							}
						}
					});
				});
				// - Desconectado del plugin.
				$scope.$on('onDetachPluginJanus',function(event) {
					console.log("event: " + event.name );
					self.PluginHandlerId = '';
					self.remoteStream = '';
					self.localStream = '';
				});
				// - Se obtine un mediaStream remoto.
				$scope.$on('onRemoteStreamPluginJanus', function(event, mStream) {
					console.log("event: " + event.name );
					self.remoteStream = $sce.trustAsResourceUrl(Records.getBlobURL(mStream));
				});
				// - Se obtine un mediaStream local.
				$scope.$on('onLocalStreamPluginJanus', function(event, mStream) {
					console.log("event: " + event.name );
					self.localStream = $sce.trustAsResourceUrl(Records.getBlobURL(mStream));
				});*/
			}]
		});