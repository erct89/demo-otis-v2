'use strict'; 

angular.module('videoCall')
	.component('videoCall',{
		templateUrl: 'js/video-call/video-call.template.html',
		controller: [ 'JANUS_SERVER', 'JANUS_ICE_SERVERS', 'Dependencies', 'Plataform', 'Records', 'Device', '$sce', '$scope', 
			function( JANUS_SERVER, JANUS_ICE_SERVERS, Dependencies, Plataform, Records, Device, $sce, $scope){ 
				
				const STATES = { "unsupport": 0, "0": "unsupport", "unconected": 1, "1": "unconected", 
						"unplugging": 2, "2": "unplugging",	"unregistered": 3, "3": "unregistered",
						"available": 4, "4": "available", "calling": 5, "5": "calling",
						"speaking": 6, "6": "speaking", "engaged": 7, "7": "engaged"};

    			const PLUGIN = 'janus.plugin.videocall';
    			
    			const MESSAGES_PLUGIN = {
    				"list": { "message": { "request": "list" } }, 
    				"call": { "message": { "request": "call", "username": null }, "jsep": null },
    				"accept": { "message":{ "request":"accept" }, "jsep":null },
    				"hangup": { "message":{ "request":"hangup"} }
    			};

				var self = this;
				var Janus = Dependencies.getDependency('window.Janus');
				var janus_session = null;
				var inputStream = null;
				var outputStream = null;
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
												self.contacts = message.result.list.filter(function(item){ return item != self.userName; });
												setTimeout(function() { if(janus_session.plugin) {janus_session.plugin.send(MESSAGES_PLUGIN.list); } }, 5000);

												console.log("Trace message: List ");
												//console.log(self.contacts);
												//console.log(message.result.list);
											}else if(message.result.event){
												console.log("Trace message: Event ");
												switch(message.result.event){
													case 'registered':
													//Se ha realizado el registro con el plugin.
														self.contacts = self.userCall = null;
														janus_session.plugin.send(MESSAGES_PLUGIN.list);
														
														_stateChange(STATES.available);
														console.log("Trace message: event registered");
														break;
													case 'calling':
													//Estamos ocupados llamando a otro usuario.
														_stateChange(STATES.calling);
														console.log("Trace message: event calling");
														break;
													case 'incomingcall':
													//Alguien nos esta llamando.
														Records.playGroup('audio').then(function(mediaStream){
															console.log(mediaStream);
															self.userCall = message.result.username || 'Anonymous';
															janus_session.plugin.createAnswer({
																jsep: jsep,
																media: { 
																	audio:true, 
																	videoSend: false, 
																	videoRecv: true, 
																	data: true
																},
																stream: mediaStream
																, success: function(jsep) {														
																	let request = MESSAGES_PLUGIN.accept
																	request.jsep = jsep;
																	janus_session.plugin.send(request);
																	_stateChange(STATES.speaking);

																	console.log("Trace message: event incomingcall answer accept.");
																}, error: function(error) {
																	closeMediaStream(inputStream);
																	closeMediaStream(outputStream);
																	self.localStream = self.remoteStream = "";
																	self.userCall = null;
																	_stateChange(STATES.available);
																	
																	console.log("Error message: event incomingcall answer error");
																	console.log(error);
																}
															});


															self.localStream = $sce.trustAsResourceUrl(Records.getBlobURL(mediaStream));
														}).catch( function(error) {
															console.log(error);
														});
														
														console.log("Trace message: event incomingcall");
														break;
													case 'accepted':
													//La llamada que se realizo ha sido acceptada.
														/*Codigo antiguo.
														self.username = message.result.username || 'Anonymous';
														if(jsep){
															janus_session.plugin.handleRemoteJsep({jsep: jsep});
														}
														_stateChange(STATES.speking);

														console.log("Trace message: event accepted.");
														*/
														if(jsep){
															janus_session.plugin.handleRemoteJsep({jsep: jsep});
														}
														_stateChange(STATES.speaking);

														console.log("Trace message: event accepted");
														break;
													case 'hangup':
													//Se ha desacoplado el plugin handler.
														self.contacts = self.userCall = null;
														self.localStream = self.remoteStream = "";
														closeMediaStream(inputStream);
														closeMediaStream(outputStream);

														_stateChange(STATES.available);

														console.log("Trace message: event hangup.");
														break;
													default:
													//Se envian mensages por defecto.
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
										outputStream = mediaStream;
										self.localStream = $sce.trustAsResourceUrl(Records.getBlobURL(outputStream));
										console.log("Attach onlocalstream:");
										console.log(arguments);
									}, onremotestream: function(mediaStream){
										inputStream = mediaStream;
										self.remoteStream = $sce.trustAsResourceUrl(Records.getBlobURL(inputStream));
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
										self.localStream = self.remoteStream = "";
										closeMediaStream(inputStream);
										closeMediaStream(outputStream);
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


				//Iniciar el registro del usuario con el plugin.
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
				

				/*Manejador para llamar*/
				self.call = function() {
					if(self.userCall.length > 0){
						if(self.state > STATES.unregistered && self.state < STATES.calling){
							//Esto lo puedo mover al servicio.
							if (janus_session) {
								if (janus_session.plugin && janus_session.plugin.createOffer) {
									Records.playGroup('audio').then(function(mediaStream){
										console.log("CREATE OFFER: MEDIASTREAM OBTENIDO");
										console.log(mediaStream.constructor.name);
										janus_session.plugin.createOffer({ 
											"media": {
												audio: true,
												videoSend: false,
												videoRecv: true,
												data: true
											}, 
											"stream": mediaStream,
											"success": function(jsep){
												_stateChange(STATES.calling);
												MESSAGES_PLUGIN.call.message.username = self.userCall;
												MESSAGES_PLUGIN.call.jsep = jsep;
												janus_session.plugin.send(MESSAGES_PLUGIN.call);
											}, "error": function(error) {
												console.log("[Call] Plugin createOffer error: ");
												console.log(error);
												self.userCall = '';
											}
										});

										self.localStream = $sce.trustAsResourceUrl(Records.getBlobURL(mediaStream));
									
									}).catch( function(error) {
										console.log("CREATE OFFER ERROR!!!!!");
										console.log(error);
									});
								} else {
									console.log("[Call] Dont exit plugin handler.");
									_stateChange(STATES.unplugging);
								}
							} else {
								console.log("[Call] Dont exit session with janus");
								_stateChange(STATES.unconected);
							}
						}
					}
				};


				/*Manejador para el colgado de llamadas.*/
				self.hangup = function() {
					if(self.state === STATES.speaking){
						if(janus_session){
							if(janus_session.plugin && janus_session.plugin.send){
								janus_session.plugin.send(MESSAGES_PLUGIN.hangup);
								janus_session.plugin.detach();
								_stateChange(STATES.unplugging);
							}else{
								_stateChange(STATES.unconected);
							}
						}else{
							_stateChange(STATES.unconected);
						}
					}
				};


				//Realiza una peticion "List"
				var listUsers = function(){
					if( self.state === STATES.registered ){
						if(Janus.getPluginHandler){
							Janus.getPluginHandler().send(MESSAGES_PLUGIN.list);
						}	
					}
				};

				//Realiza el cerrado de un mediaStream
				/*var closeMediaStream = function (mediaStream) {
					mediaStream = mediaStream || {}; //Evito los problemas cuando el argumento es nulo.
					if(mediaStream.getTracks){
						mediaStream.getTracks().forEach(function (mStreamTrack) {
							mStreamTrack.stop();
						});
					}
				}*/

				//Realiza el cerrado de un array de mediaStreams
				var closeMediaStream = function (mediaStreams) {
					mediaStreams = Array.isArray(mediaStreams)? mediaStreams: [];
					mediaStreams.forEach(function(mediaStream){
						if(mediaStream.getTracks){
							mediaStream.getTracks().forEach(function(mStreamTrack){
								mStreamTrack.stop();
							});
						}
					});
				}
			}]
		});