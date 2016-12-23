'use strict';

angular.module('webrtc').service('Janus', 
	['JANUS_SERVER','JANUS_ICE_SERVERS', 'Dependencies', 'Util', '$rootScope',
		function(JANUS_SERVER, JANUS_ICE_SERVERS, Dependencies, Util, $rootScope){
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
					return true;
				}else{
					_stateChange(STATES.unsupported);

					return false;
				}
			};

			/*
				loadJanus()
					- Description: Realiza la inicializacion de la libreria Janus.
					< return: <Promise> es una forma facil de poder controlar mejor cuando
					inicia la libreria de Janus.
			*/
			var loadJanus = function () {
				return new Promise( function (resolve, reject) {
					if (_isSupport()) {
						if (Janus.initDone){ //No hay por que iniciar si ha esta iniciado.
							console.log("Janus - ya fue iniciado.");
							resolve();
						} else {
							Janus.init({debub: true, callback: function(){
								console.log("Janus - acaba de ser iniciado");
								_stateChange(STATES.disconnected);

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
					loadJanus().then( function() {
						if(!self.janusSession){
							self.janusSession = new Janus({ 
								server: JANUS_SERVER, //'https://janus.conf.meetecho.com/janus', 
								iceServers: JANUS_ICE_SERVERS,
								success: function () { 
									console.log('Creada la session en Janus');
									_stateChange(STATES.connected);

									self.janusSession.pluginHandler = null;
									$rootScope.$broadcast('onNewSessionJanus', null);
									resolve(); 
								}, error: function ( error ) { 
									console.log('Error al crear session en Janus');

									$rootScope.$broadcast('onErrorJanus', error);
									reject(error); 
								}, destroyed: function() { 
									console.log('Destruida la session con Janus');
									self.janusSession = null;
									_stateChange(STATES.disconnected);

									$rootScope.$broadcast('onDestroySessionJanus', null);
									resolve({ message: "The session has been destroyed" }); 
								}
							});
							console.log(self.janusSession);
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
								
								pluginHandler.name  = pluginName;
								pluginHandler.uses = {};
								pluginHandler.use = function(callback, target, value){
									callback = ( callback instanceof Function )? callback: function (){}; 
									target = ( typeof(target) === 'string' )? target: "full";
									pluginHandler.uses[target] = pluginHandler.uses[target] || [];
									pluginHandler.uses[target].push({callback: callback, value: value});
								};

								pluginHandler.use(function(msg, jsep){ 
									console.log("{ message: ");
									console.log(msg);
									console.log("Jsep: ");
									console.log(jsep);
									console.log("}")
								});

								self.janusSession.pluginHandler = pluginHandler

								$rootScope.$broadcast( 'onAttachPluginJanus', pluginHandler);
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
								//Platearlo como un proceso vertical, donde hay 4 tipo de peticines.
								// - Todos los parametros "full",
								// - Solo o "msg" ("message") o "jsep" ("jsep").
								// - Propieda de msg ex: "result.list" -> "msg.result.list"
								for(var use of self.janusSession.pluginHandler.uses["full"]){
									use.callback(msg, jsep);
								}
								if(msg){
									for(var use of self.janusSession.pluginHandler.uses["message"]){
										use.callback(msg);
									}
								}
								if(jsep){
									for(var use of self.janusSession.pluginHandler.uses["jsep"]){
										use.callback(jsep);
									}
								}
								for(var target in self.janusSession.pluginHandler.uses){
									var property = Util.getPropertyForFullName(msg,target.split('.'));
									if(property){
										if(self.janusSession.pluginHandler.uses[target].value === undefined){
											
										}
									}
								}

								for(var target in self.janusSession.pluginHandler.uses){
									if(target === "full"){
										for(var callback of self.janusSession.pluginHandler.uses[target]){
											callback(msg, jsep);
										}
									}else if( target === "message"){
										for(var callback of self.janusSession.pluginHandler.uses[target]){
											callback(msg);
										}
									}else if( target === "jsep" ){
										for(var callback of self.janusSession.pluginHandler.uses[target]){
											callback(jsep);
										}
									} else{
										for(var callback of self.janusSession.pluginHandler.uses[target]){
											var property = Util.getPropertyForFullName(msg,target.split('.'));
											callback(msg, jsep, property);
										}
									}
								}
								
								//Se ha recibido resultado.
								if(msg.result) {
									if( msg.result["list"] ) {
									} else if( msg.result["event"] ) {
										if(msg.result.event === 'registered') {
											console.log("User " + msg.result.username + " registered.");
											self.janusSession.pluginHandler.send({"message": { "request": "list" }});
										} else if(msg.result.event === 'calling') {
											console.log("Wait ");
										} else if(msg.result.event === 'incomingcall') {
											console.log("Incoming call from " + msg.result.username + "!");
											self.janusSession.pluginHandler.createAnswer({
												jsep: jsep,
												media: { 
													audio: true, 
													video: false, 
													data: true 
												}, success: function(jsep) {
													self.janusSession.pluginHandler.send({
														"message": {"request": "accept"}, 
														"jsep": jsep}
													);
												},
												error: function(error) {
													console.log("Webrct error: ");
													console.log(error);
												}
											});
										} else if(msg.result.event === 'accepted') {
											console.log("Offerta acceptada por: " + msg.result.username);
											if(jsep !== null && jsep !== undefined){
												self.janusSession.pluginHandler.handleRemoteJsep({jsep: jsep});
											}
										} else if(event === 'hangup') {
											console.log("Call hangup by " + msg.result.username + "(" + msg.result.reason + ")!");
											self.janusSession.pluginHandler.hangup();
										}
									}
								} else {
									self.janusSession.pluginHandler.hangup();									
								}
							}, onlocalstream: function(mStream) { 
								console.log("onLocalStream: "); 
								$rootScope.$broadcast('onLocalStreamPluginJanus', mStream); 
							}, onremotestream: function(mStream) { 
								console.log("onRemoteStream: "); 
								console.log(mStream);
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