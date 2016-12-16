'use strict';

angular.module('webrtc').service('Janus', 
	['JANUS_SERVER','JANUS_ICE_SERVERS', 'Dependencies', '$rootScope',
		function(JANUS_SERVER, JANUS_ICE_SERVERS, Dependencies, $rootScope){
			const STATES = {
				'unsupported': 0, '0': 'unsupported',
				'supported': 1, '1': 'supported',
				'disconnected': 2, '2': 'disconnected',
				'connected': 3, '3': 'connected',
				'attached': 4, '4': 'attached',
				'using': 5, '5': 'using'
			};

			var self = this;

			var Janus = Dependencies.getDependency('window.Janus');
			var JQuery = Dependencies.getDependency('window.jQuery');
			var Adapter = Dependencies.getDependency('window.AdapterJS');

			self.janusSession; 
			self.pluginName;
			self.janusPluginHandler;
			self.state;

			/*
				_isSupport()
					- Description: Permite saber si hay soporte para la funcionalidad, para ello
					se comprueba que existan todas las dependencias. 
					< return: <Boolean> Retorna un booleano que indica si existe soporte o no.
			*/
			var _isSupport = function() {
				if( Boolean(Janus) && Boolean(Adapter) && Boolean(JQuery) ){
					if ( self.state === STATES.unsupported ) { //Solo se cambia el estado cuando es STATES.unsupported.
						_stateChange(STATES.supported);
					}	
					//state = STATES.supported; //DELETE*
					return true;
				}else{
					if ( self.state != STATES.unsupported ) { //Por si se pierde soporte en tiempo de ejecucion.
						_stateChange(STATES.unsupported);
					}
					return false;
				}
			};

			/*
				_initJanus()
					- Description: Realiza la inicializacion de la libreria Janus.
					< return: <Promise> es una forma facil de poder controlar mejor cuando
					inicia la libreria de Janus.
			*/
			var _initJanus = function () {
				return new Promise( function (resolve, reject) {
					if (_isSupport()) {
						if (Janus.initDone){ //No hay por que iniciar si ha esta iniciado.
							console.log("Janus - ya fue iniciado.");
							resolve();
						} else {
							Janus.init({debub: true, callback: function(){
								console.log("Janus - acaba de ser iniciado");
								_stateChange(STATES.disconnected);
								//state = STATES.disconnected;
								return resolve();
							}});
						}
					} else {
						console.log("Janus - No se puede iniciar");
						reject("Janus library no load.");
					}
				} );
			}

			/*
				_createSession()
					- Description: Realiza la conexion con el servidio de Janus.
					< return: <Promise> para poder encadenar de forma sencilla funciones asincronas.
			*/
			var _createSession = function ( servers, iceServers ) {
				return new Promise ( function( resolve, reject ) {
					_initJanus().then( function() {
						if(!self.janusSession){
							self.janusSession = new Janus({ 
								server: 'https://janus.conf.meetecho.com/janus',//JANUS_SERVER, 
								//iceServers: JANUS_ICE_SERVERS,
								success: function () { 
									console.log('Creada la session en Janus');
									_stateChange(STATES.connected);

									self.janusSession.plugins = {};
									$rootScope.$broadcast('onNewSessionJanus', null);
									resolve(); 
								}, error: function ( error ) { 
									console.log('Error al crear session en Janus');

									$rootScope.$broadcast('onErrorJanus', error);
									reject(error); },
								destroyed: function() { 
									console.log('Destruida la session con Janus');

									self.janusSession = null;
									_stateChange(STATES.disconnected);
									///*DELETE*/state = STATES.disconnected;
									$rootScope.$broadcast('onDestroySessionJanus', null);
									resolve({ message: "The session has been destroyed" }); 
								}
							});
						} else{
							console.log('Ya existe una session');
							_stateChange(STATES.connected);
							$rootScope.$broadcast('onNewSessionJanus', null);
							resolve();
						}	
					}).catch(function(error) {
						$rootScope.$broadcast('onErrorJanus', error); 
						reject(error); 
					});
				});
				
			};

			/*
				_destroySession(janusSession)
					- Description: Siempre que exista una session de Janus, se destruye.
					> janusSession: <new Janus> Instancia de una instancia de Janus.
			*/
			var _destroySession = function(janusSession) {
				if(janusSession instanceof Janus){
					if(janusSession.isConnected){
						if(janusSession.isConnected()){
							janusSession.destroy();	
						}
					}
				}
			};

			/*
				_attachToPlugin(janusSession, pluginName)
					- Description: Pedimos a nuestro servidor de Janus unirnos a un plugin, 
						para lo cual necesitamos una instancia con una session iniciada con Janus 
						y el nombre de un plugin.
					> janusSession: <new Janus.isConnected()> Una session con janus activa.
					> pluginName: <String> Nombre de plugin al que deseamos unirnos.
			*/
			var _attachToPlugin = function(janusSession, pluginName) {
				return new Promise(function (resolve, reject) {
					var message;
					//Validaciones de los parametros.
					if ( typeof(pluginName) !== 'string' ){
						message = 'Argument \'pluginName\' isn´t no string.';
					} else if ( !(janusSession instanceof Janus) ){
						message = 'The instance of janus isn´t instance of Janus library.';
					} else if ( !janusSession.isConnected() ){
						message = 'The janus isn´t connected.'
					} else if ( !message ){ 
						janusSession.attach({
							plugin: pluginName,
							success: function(pluginHandler){ 
								console.log('Plugin handler success');

								_stateChange(STATES.attached);
								
								$rootScope.$broadcast( 'onAttachPluginJanus', pluginHandler.id );
								
								//self.janusPluginHandler = pluginHandler;
								self.janusSession.pluginHandler = pluginHandler
								self.pluginName = pluginName;
								
								resolve(pluginHandler); 
							}, error: function(error){ 
								console.log('Plugin handler error');
								console.log(error);

								$rootScope.$broadcast( 'onErrorJanus', error );
								reject(error); 
							}, consentDialog: function(on){ 
								//Interviene anter y despues de la obtencio del GetUserMedia.
								console.log("consentDialog: "); 
								console.log(on); 
							}, onmessage: function (msg, jsep) {
								//Platearlo como una  
								console.log("onMessage: "); 
								console.log(" Message -> " ); 
								console.log(msg); 
								console.log(" JSEP -> "); 
								console.log(jsep); 
								
								//Se ha recibido resultado.
								if(msg.result) {
									if( msg.result["list"] ) {
										console.log("Result List:");
										msg.result.list.forEach(function(item) {
											console.log(item);
										});
									} else if( msg.result["event"] ) {
										if(msg.result.event === 'registered') {
											console.log("User " + msg.result.username + " registered.");
											self.janusSession.pluginHandler.send({"message": { "request": "list" }});
										} else if(msg.result.event === 'calling') {
											console.log("Wait ");
										} else if(msg.result.event === 'incomingcall') {
											console.log("Incoming call from " + msg.result.username + "!");
											/*Janus.log("Incoming call from " + result["username"] + "!");
											$('#peer').val(result["username"]).attr('disabled');
											yourusername = result["username"];
											// TODO Enable buttons to answer
											videocall.createAnswer(
												{
													jsep: jsep,
													// No media provided: by default, it's sendrecv for audio and video
													media: { data: true },	// Let's negotiate data channels as well
													success: function(jsep) {
														Janus.debug("Got SDP!");
														Janus.debug(jsep);
														var body = { "request": "accept" };
														videocall.send({"message": body, "jsep": jsep});
														$('#peer').attr('disabled', true);
														$('#call').removeAttr('disabled').html('Hangup')
															.removeClass("btn-success").addClass("btn-danger")
															.unbind('click').click(doHangup);
													},
													error: function(error) {
														Janus.error("WebRTC error:", error);
														bootbox.alert("WebRTC error... " + JSON.stringify(error));
													}
												});*/
										} else if(msg.result.event === 'accepted') {
											console.log("Offerta acceptada por: " + msg.result.username);
											if(jsep !== null && jsep !== undefined){
												self.janusSession.pluginHandler.handleRemoteJsep({jsep: jsep});
											}
										} else if(event === 'hangup') {
											/*Janus.log("Call hung up by " + result["username"] + " (" + result["reason"] + ")!");
											// TODO Reset status
											videocall.hangup();
											if(spinner !== null && spinner !== undefined)
												spinner.stop();
											$('#waitingvideo').remove();
											$('#videos').hide();
											$('#peer').removeAttr('disabled').val('');
											$('#call').removeAttr('disabled').html('Call')
												.removeClass("btn-danger").addClass("btn-success")
												.unbind('click').click(doCall);
											$('#toggleaudio').attr('disabled', true);
											$('#togglevideo').attr('disabled', true);
											$('#bitrate').attr('disabled', true);
											$('#curbitrate').hide();
											$('#curres').hide();*/
										}
									}
								} else {
									// FIXME Error?
									/*var error = msg["error"];
									bootbox.alert(error);
									if(error.indexOf("already taken") > 0) {
										// FIXME Use status codes...
										$('#username').removeAttr('disabled').val("");
										$('#register').removeAttr('disabled').unbind('click').click(registerUsername);
									}
									// TODO Reset status
									videocall.hangup();
									if(spinner !== null && spinner !== undefined)
										spinner.stop();
									$('#waitingvideo').remove();
									$('#videos').hide();
									$('#peer').removeAttr('disabled').val('');
									$('#call').removeAttr('disabled').html('Call')
										.removeClass("btn-danger").addClass("btn-success")
										.unbind('click').click(doCall);
									$('#toggleaudio').attr('disabled', true);
									$('#togglevideo').attr('disabled', true);
									$('#bitrate').attr('disabled', true);
									$('#curbitrate').hide();
									$('#curres').hide();
									if(bitrateTimer !== null && bitrateTimer !== null) 
										clearInterval(bitrateTimer);
									bitrateTimer = null;*/
								}
							}, onlocalstream: function(mStream) { 
								console.log("onLocalStream: "); 
								$rootScope.$broadcast('onLocalStreamPluginJanus', mStream); 
							}, onremotestream: function(mStream) { 
								console.log("onRemoteStream: "); 
								$rootScope.$broadcast('onRemoteStreamPluginJanus', mStream); 
							}, ondataopen: function (x) { 
								console.log("onDataOpen: "); 
								console.log(x);
							}, ondata: function(x) { 
								console.log("onData: "); 
								console.log(x); 
							}, oncleanup: function (x) { 
								console.log("onCleanup: "); 
								console.log(x);
								_stateChange(STATES.connected);
								self.janusSession.pluginHandler = null;
								$rootScope.$broadcast( 'onDetachPluginJanus', null );
							}
						});
					} else {
						console.log("Attach Error: " + message);
						reject(message);
					}
				});
			};

			/*
				_detachPlugin(pluginHandler)
					- Description: Realiza la peticion de desconecxion sobre el PluginHandler.
						- pluginHandler: <Object> Objeto que representa el manejador del plugin. 
			*/
			var _detachPlugin = function(pluginHandler) {
				if(pluginHandler){
					if(pluginHandler.detach){
						pluginHandler.detach();
					}
				}
			};

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
						$rootScope.$broadcast('onStateChangeJanus', {state: self.state, value: STATES[self.state]});
					}
				}
			};

			/*
				_launchEventMessge(Event)
					- Description: Genera eventos segun el objeto que entra.
					> Event: <Object> Objeto con el siguiente formato {"nombredelplugin"} 
			*/

			//Inicializacion de propiedades.
			_stateChange(STATES.unsupported);

			//Servicio
			return {
				getState: function() { return self.state; },
				isSupport: function() { return _isSupport(); },
				createSession: function() { return _createSession( JANUS_SERVER,JANUS_ICE_SERVERS ); },
				destroySession: function() { _destroySession( self.janusSession ); },
				attachToPlugin: function(pluginName){ 
					return _attachToPlugin( self.janusSession, pluginName ); 
				}, detachPlugin: function(){ return _detachPlugin( self.janusSession.pluginHandler ); },				
				getSession: function(){ return self.janusSession; },
				getPluginHandler: function(){ 
					if(self.janusSession){
						return self.janusSession.pluginHandler;
					}
				}
			};
		}]);