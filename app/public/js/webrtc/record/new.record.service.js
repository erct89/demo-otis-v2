'use strict'

angular.module('webrtc').service('Records', 
	['Dependencies','Util','$rootScope','$http', function( Dependencies, Util, $rootScope, $http){
		var self = this;
		//Instancias de las multiples dependencias que queremos usar.
		var MStream = Dependencies.getDependecy("window.MediaStream");
		var MRecord = Dependencies.getDependecy("window.MediaRecorder");
		var URL = Dependencies.getDependecy("window.URL");
		var Blob = Dependencies.getDependecy("window.Blob");
		var FReader = Dependencies.getDependecy("window.FileReader");
		var AudioContext = Dependencies.getDependecy("window.AudioContext");

		//Lista de atributos que deseamos gestionar.
		var records = [] //Lista de Objetos Record.
		var record = null;

		//Objeto Record a ser gestionado.
		function Record(id, name, mstream, options) {
			var that = this;
			var chunks = [];
		 	
		 	//Propiedades publicas.
		 	that.id = id || null;
		 	that.name = name || null;
		 	that.mimeType = options.mimeType || null;
		 	that.blob = null;
		 	that.mstream = (mstream instanceof MStream)? mstream: null;
		 	that.rec = null;

		 	if(that.mstream && that.mimeType.mime && that.mimeType.ext){
		 		if(MRecord.isTypeSupported(that.mimeType.mime)){
		 			that.rec = new MRecord(that.mstream,{mimeType: that.mimeType.mime});
		 			$rootScope.$broadcast('onNewRecord',null);

		 			that.rec.onstart = function(event) {
		 				$rootScope.$broadcast('onStartRecord', event);
		 				console.log('Record state starting.');
		 			};
		 			that.rec.onpause = function(event) {
		 				$rootScope.$broadcast('onPausetRecord', event);
		 				console.log('Record state pause.');
		 			};
		 			that.rec.onresume = function(event) {
		 				$rootScope.$broadcast('onResumeRecord', event);
		 				console.log('Record state resume.');
		 			};
		 			that.rec.onwarning = function(event) {
		 				$rootScope.$broadcast('onWarningRecord',event);
		 				console.log('Record state warning: ' + event);
		 			};
		 			that.rec.onstop = function(event) {
		 				console.log('Record state stop.');
						that.blob = new Blob(chunks,{type:that.mimeType.mime});
						that.id = new Date().getTime();
						that.name = Util.generateString(that.id,Record.getType(that.mimeType.mime),that.mimeType.ext,{top:'_',bottom:'.'});
						
						chunks = [];
						that.rec = null;
						$rootScope.$broadcast('onStopRecord', null);
		 			};
		 			that.rec.onerror = function(error) {
		 				$rootScope.$broadcast('onErrorRecord',error);
		 				console.log('Record state error: ' + error);
		 			};
		 			that.rec.ondataavailable = function(event) {
		 				$rootScope.$broadcast('onDataavailableRecord', event);
		 				console.log('Record state data available.');
						if(event.size != 0){ 
							var reader = new FileReader(event.data);
							reader.onloadend = function() {
								console.log(reader.result);
							};
							reader.readAsBinaryString(event.data);
							chunks.push(event.data);
						}
		 			};
		 		}
		 	}
		}

		/*
			start()
				- Description: Inicia la grabacion si se puede.
				< return: <Boolean> True si se inicia la grabacion y False si no se puede.
		*/
		Record.prototype.start = function() {
			var result = false;

			//El objeto pasado es una instancia de MediaStream y el objeto options contiene mimeType.
			if(this.mstream && this.rec && (this.rec.state === 'inactive' || this.rec.state === 'paused')){
				this.rec.start();
				result = true;
			}

			return result;
		};

		/*
			stop()
				- Description: Invoca al metodo stop del mediaRecorder, solo si existe.
				< return: <Boolean> True si se realizo la parada y False si no se puede.
		*/
		Record.prototype.stop = function() {
			var result = false;

			if(this.rec && (this.rec.state === 'recording')){
				this.rec.stop();
				result = true;
			}

			return result;
		};
		
		/*
			save()
				- Description: Enviar un POST con el nombre y un blob en base 64 al servidor.
				< return: <Promise> Then(Success Message) and Catch(Error Message). 
		*/
		Record.prototype.save = function() {
			var that = this;
			console.log(this);
			return new Promise(function(resolve, reject) {
				if((that.blob instanceof Blob) && that.name && Record.getType(that.mimeType.mime)){
					blobToB64(that.blob)
						.then(function(blob64) {
							return $http.post('record/' + Record.getType(that.mimeType.mime),{ 
								data: {
									name: that.name, 
									blob64: blob64
								}, 
								headers:{'Content-type':'application/json'}
							});
						}).then(function(data) {
							resolve(data);
						}).catch(function(error) {
							reject(error);
						});
				}else{
					reject({error: "Don´t exist object Blob"});
				}
			});
		}; 

		/*
			delete(name)
				- Description: Borra del servidor el record con el nombre correspondiente a name.
				< return: <Promise> Then(Success Message) and Catch(Error Message).
		*/
		Record.prototype.delete = function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				if(that.id && Record.getType(that.mimeType.mime)){
					$http.delete('record/'+ Record.getType(that.mimeType.mime) +'/'+ that.id,{
							headers:{'Content-type':'application/json'}
						}).then(function(data) {
							resolve(data);
						}).catch(function (error) {
							reject(error);
						});
				}else{
					reject({error:"This object have not id property."});
				}
			});
		};
		
		/*
			get(name)
				- Description: Optiene un Record del servidor correspondiente al name pasado como attributo.
				< return: <Promise> Then(DATOS) un objeto Record con los datos and Catch(Error Message);
		*/
		Record.prototype.get= function() {
			var that = this;
			return new Promise(function(resolve,reject) {
				if(that.id && Record.getType(that.mimeType.mime)){
					$http.get('record/'+ Record.getType(that.mimeType.mime) +'/' + that.id)
						.then(function(data) {
							that.blob = b64ToBlob(data.data,that.mimeType.mime);
							resolve(that);
						}).catch(function(error) {
							reject(error);
						});
				}else{
					reject({error: "This object don´t have id or mimeType"});
				}
			});
		};

		/*
			getUserMedia() //No funciona por culpa de que 'decodeAudioData(ArrayBuffer)'
				- Description: Generar un MediaStream desde una grabación
				< return: <Promise> then(MediaStream) or catch(error)

		*/
		/*
		Record.prototype.getUserMedia = function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				//Comprobenos que tenermos todo lo necesario.
				// 1.- Soporta la libreria AudioContext?
				if(AudioContext){
					//2.- Es una grabacion de audio?
					if( Record.getType(that.mimeType.mime) === 'audio'){
						// 3.- Este objeto contiene un objeto Blob?
						if( that.blob){
							// 4.- Necesito que el Blob este en formato ArrayBuffer!
							blobToArrayBuffer(that.blob)
								.then(function(arrayBuffer) {
									//ArrayBuffer creado.
									// 5.- Necisito crear un audioContext para poder trabajar sobre el audio.
									let audio_context = new AudioContext();
									let destination = audio_context.createMediaStreamDestination();
									let source = null;
									console.log(arrayBuffer);
									// 6.- Decodifiquemos los datos del audio contenidos en el ArrayBuffer.
									audio_context.decodeAudioData(arrayBuffer)
										.then(function(buffer) {
											// 7.- Ahora creemos la fuente de datos.
											if(source !== null){
												source.stop();
												source.disconnect(0);
												source = null
											}
											
											source = audio_context.createBufferSource();
											source.buffer = buffer;
											source.start();
											source.connect(destination);

											//Retornando el mediaStream.
											resolve(destination.stream);
										}).catch(function(error) {
											//Nooo
											console.log("NOOOOOOO");
											reject({error: error});
										});
								}).catch(function(error) {
									//Oooooh no se ha podido crear un arraybuffer.
									reject({error: error});
								});
						}else{
							reject({error: "no recording"});
						}
					}else{
						reject({error: "it is not an audio recording"});
					}
				}else{
					reject({error: "no support for AudioContext API"});
				}
			});
		};
		*/

		/*
			getUserMedia() //Pasa lo mism, el problema no es ArrayBuffer es 'decodeAudioData(ArrayBuffer)'
				- Description: Generar un MediaStream desde una grabación
				< return: <Promise> then(MediaStream) or catch(error)

		*/
		/*
		Record.prototype.getUserMedia = function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				//Comprobenos que tenermos todo lo necesario.
				// 1.- Soporta la libreria AudioContext?
				if(AudioContext){
					//2.- Es una grabacion de audio?
					if( Record.getType(that.mimeType.mime) === 'audio'){
						// 3.- Este objeto contiene un objeto Blob?
						if( that.name){
							// 4.- Necesito que el Blob este en formato ArrayBuffer!
							$http({
									method: 'GET',
									url: 'records/audio/' + that.name,
									responseType: 'arraybuffer'
								}).then(function(response) {
									var audio_ctx = new AudioContext();
									var audio_source = audio_ctx.createBufferSource();
									
									var prueba = audio_ctx.decodeAudioData(response.data,(s)=>{console.log("je");},(e)=>{console.log('jo');console.log(e);})
										.then(function(audio_buffer) {
											resolve(audio_buffer);
										}).catch(function(error) {
											reject(error);
										});
								}).catch(function(error) {
									reject(error);
								});
						}else{
							reject({error: "no recording"});
						}
					}else{
						reject({error: "it is not an audio recording"});
					}
				}else{
					reject({error: "no support for AudioContext API"});
				}
			});
		};
		*/

		/*
			getUserMedia() 
				Probando a generar AudioBuffer a pelo.
				- Description: Generar un MediaStream desde una grabación
				< return: <Promise> then(MediaStream) or catch(error)
		*/
		/*Record.prototype.getUserMedia = function() {
			var that = this;

			return new Promise(function(resolve, reject) {
				if(AudioContext){
					if(Record.getType(that.mimeType.mime) === 'audio'){
						if(that.name){
							$http({
								method: "GET",
								url: "records/audio/" + that.name,
								responseType: "arraybuffer"
							}).then(function(response) {
								let blob = new Blob(response.data);
								
								blobToArrayBuffer(blob).then(function(array_buffer) {
									let channels = 1;
									array_buffer = new DataView(array_buffer.buffer);
									let ab_length = array_buffer.byteLength;
									let audio_ctx = new AudioContext();
									let audio_buffer = audio_ctx.createBuffer(1,ab_length,48000);
									let destination = audio_ctx.createMediaStreamDestination();
									for (var channel = 0; channel < channels; channel++) {
										// This gives us the actual ArrayBuffer that contains the data
										var nowBuffering = audio_buffer.getChannelData(channel);
										for (var i = 0; i < ab_length; i++) {
										// Math.random() is in [0; 1.0]
										// audio needs to be in [-1.0; 1.0]
											nowBuffering[i] = array_buffer.getInt8(i);
										}
									}
									let audio_source = audio_ctx.createBufferSource();
									audio_source.buffer = audio_buffer;
									audio_source.start();
									audio_source.connect(destination);

									resolve(destination.stream);
								}).catch(function(error) {
									reject(error);
								});
							}).catch(function(error) {
								reject(error);
							});
						}else{
							reject({error: "no recording"});
						}
					}else{
						reject({error: "it is not an audio recording"});
					}
				}else{
					reject({error: "no support for AudioContext API"});
				}
			});
		};*/

		Record.prototype.getUserMedia = function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				if(AudioContext){
					var ctx = new AudioContext();
					var src = ctx.createBufferSource();
					that.get().then(function(record) {
							return blobToArrayBuffer(record.blob);
						}).then(function(array_buffer) {
							let channels = 1;
							let buffer = new DataView(array_buffer);
							let length = buffer.byteLength;
							let audio_buffer = ctx.createBuffer(channels,length,48000);
							let destination = ctx.createMediaStreamDestination();

							for (var channel = 0; channel < channels; channel++) {
								// This gives us the actual ArrayBuffer that contains the data
								var nowBuffering = audio_buffer.getChannelData(channel);
								for (var i = 0; i < length; i++) {
								// Math.random() is in [0; 1.0]
								// audio needs to be in [-1.0; 1.0]
									nowBuffering[i] = buffer.getUint8(i);
								}
							}

							src.buffer = audio_buffer;
							src.start();
							src.connect(destination);

							resolve(destination.stream);
						}).catch(function(error) {
							reject(error);
						});
				}else{
					reject({error: "no support for AudioContext API"});
				}
			});
		};
		
		/*
			getType()
				- Description: Obtien el tipo de grabacion que se ha realizado si Vdieo u Audio.
				< record: <String [audio|video|*] > 
		*/
		Record.getType= function(mimeType) {
			var type = typeof(mimeType)==='string'? mimeType: null;
			type = MRecord.isTypeSupported(type)? type: null;
			
			if(type){
				type = type.split(';')[0].split('/')[0];
			}

			return type;
		};


		/*
			isSupport()
				- Description: Retorna un boleano que indica si es posible realizar Grabaciones,
					para ello se obtine al principio una referencia a cada uno de los objetos que son
					necesarios para el funcionamiento del modulo.
				< return: <Boolean> True cuando todas las librerías necesarias existen y False si
					falta alguna.
		*/
		var isSupport = function () {
			return Boolean(MStream && MRecord && Blob && URL && FReader);
		}
		/*
			createRecord(mediaStream, options) 
				-Description: Retorna una promesa que resuelve si se puede crear un nuevo Record o no.
				> mediaStrema: <Object> Objeto MediaStream que tiene que ser grabado.
				> options: <Object> Objeto con la configuracion mimeType que se le pasa al MediaRecorder.
				< return: <Promise> Promesa que devolvera el Record Object o un error si no se puede crear el objeto.
		*/
		var createRecord = function(mediaStream, options) {
			return new Promise(function(resolve, reject) {
				var record = null;
				mediaStream = (mediaStream instanceof MStream)? mediaStream: null;
				options = options || {};
				options.mimeType = options.mimeType || {};
				options.mimeType.mime = options.mimeType.mime || '';
				options.mimeType.ext = options.mimeType.ext || '';
				//- Hay soporte para las API´s MediaRecorder, URL y FileReader.
				//- Existe un objeto mediaRecord.
				//- El objeto pasado es un MediaStream.
				if(isSupport() && mediaStream){
					//Comporbar que el tipo mime es soportado.
					if(MRecord.isTypeSupported(options.mimeType.mime)){
						record = new Record(null, null, mediaStream, options);
						console.log(record);
						resolve(record);
					}else{
						reject({error:"MimeType don´t support."});
					}
				}else{
					reject({error:"No support API´s"});
				}
			});
		};


		/*
		blobToB64(Blob)
			- Description: Recibimos una instancia de Blob y la transformatos a base64.
			< retunr: <Promise> then(base64) and catch(error message)
		*/
		var blobToB64 = function(blob){
			return new Promise(function(resolve ,reject){
				var reader = new FReader();
				reader.onload = function(){
					var dataUrl = reader.result;
					var base64 = dataUrl.split(',')[1];
					resolve(base64);
					console.log(base64);
				};
				reader.readAsDataURL(blob);
			});
		};

		/*
			b64ToBlob(b64Data, contentType, sliceSize)
				- Description: Transforma un string en base64 a un objeto Blob
				> b64Data: <String> Datos en base64.
				> contentType: <String> un mimeType que indica el tipo de datos.
				> sliceSize: <Numbre> integer que indica el tamaño de cada porcion de b64Data.
				< return: <Blob> una instancia de un objeto Blob.
		*/
		var b64ToBlob = function (b64Data, contentType, sliceSize) {
			contentType = contentType || '';
			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
		  			byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}
			var blob = new Blob(byteArrays, {type: contentType});
			return blob;
		};

		/*
			blobToArrayBuffer(blob)
				- Description: Obtener un ArrayBuffer partiendo del un objeto Blob.
				> blob: <Blob> 
				< return: <Promise> then(ArrayBuffer) and catch(err).
		*/
		var blobToArrayBuffer = function (blob) {
			return new Promise(function(resolve, reject) {
				blob = (blob instanceof Blob)? blob: null;
				if(isSupport() && blob){
					let reader = new FReader();
					reader.onloadend = function() {
						resolve(reader.result);
					};
					reader.readAsArrayBuffer(blob);
				}else{
					reject({error:"your browser don´t support this capacity"});
				}
			});
		};


		/*
			getBlobURL(blob)
				- Description: Crear un DataURL desde el Blob contenido en el objeto.
				< blob: La fuente de datos con la que hay que crear el DataUrl.
				< return: <String> Url con los datos del blob.
		*/
		var getBlobURL = function(blob) {
			var result = null;
			blob = blob || null;
			
			if(isSupport()){
				if(blob){
					result = URL.createObjectURL(blob);
				}
			}
			console.log("DATAURL");
			console.log(result);
			return result;
		}

		/*
			get(mimetype, id)
				- Descrition: Si recibe un type y id retorna la grabacion correspondiente.
					Si recibe type devuelve una array con los nombre de los ficheros contenidos
					de ese tipo.
					Si no recibe nada retorna un objeto con el siguiente formato {audio: , video: },
					con los nombre de los ficheros de cada tipo.
				> mimetype: <Object> Tipo de datos que se desea recoger.
				> id: <String> Identificador del record.
				< return: <Promise>
		*/
		var get = function(mimetype, id) {
			var result;
			mimetype = (typeof(mimetype) === 'object') ? mimetype: null;
			id = (typeof(id) === 'string')? id: null;
			
			if(mimetype && id){
			//Existe mimeType y id:
			// 1.- Creamos un objeto Record con mime and id;
			// 2.- LLamamos a su metodo get(); 
				result = new Records(id,null,null,{mimetype: mimeType});
				return result.get();
			}else if(mimetype.mime){
			//Existe el objeto mimeType.
			// 1.- Obtenemos el tipo de dato que es.
			// 2.- Realizamos una peticion sobre record/type.
			// 3.- Procesamos la información para crear un array de records.
			// 4.- Los record contienen el nombre, id, mime.
				let type = Record.getType(mimetype.mime);
				return new Promise(function(resolve,reject) {
						let records = [];

						$http.get('record/' + type).then(function(serverData) {
							for(let rec of serverData.data[type]){
								records.push(new Record(rec.match(/\d{13}/g)[0],rec,null,{mimeType:mimetype}))
							}
							resolve(records);
						}).catch(function(error) {
							reject(error);
						});
					});
			}else{
				return $http.get('record/');
			}
		};


		return {
			isSupport: function() { return isSupport(); },
			createRecord: function (mediaStream, options) { return createRecord(mediaStream, options); },
			get: function(type, id) { return get(type, id); },
			blobToB64: function(blob) { return blobToB64(); },
			b64ToBlob: function (b64, contentType, sliceSize) { return b64ToBlob(b64, contentType, sliceSize); },
			getBlobURL: function (blob) { return getBlobURL(blob); }
		};
	}]);