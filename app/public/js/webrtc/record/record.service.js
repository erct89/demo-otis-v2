'use strict'

angular.module('webrtc').factory('Record', ['Util','Dependencies','$rootScope', 
	function(Util, Dependencies, $rootScope){
		var self = this;
		var MStream = Dependencies.getDependecy("window.MediaStream");
		var MRecord = Dependencies.getDependecy("window.MediaRecorder");
		var URL = Dependencies.getDependecy("window.URL");
		var Blob = Dependencies.getDependecy("window.Blob");
		var FReader = Dependencies.getDependecy("window.FileReader");
		
		var mediaRecord = null;
		var objectRecord = {};

		var createRecord = function(mediaStream, options){
			mediaStream = (mediaStream instanceof MStream)? mediaStream: null;
			options = options || {};
			options.mimeType = options.mimeType || null;
			//- Hay soporte para las API´s MediaRecorder, URL y FileReader.
			//- Existe un objeto mediaRecord.
			//- El objeto pasado es un MediaStream.
			if(isSupport() && !mediaRecord && mediaStream){
				//Comporbar que el tipo mime es soportado.
				if(MRecord.isTypeSupported(options.mimeType)){
					var chunks = [];
					$rootScope.$broadcast('onCreateRecord', null);
					mediaRecord = new MRecord(mediaStream, options);
					
					mediaRecord.onstart = function(event){
						objectRecord = new Object();
						$rootScope.$broadcast('onStartRecord',null);
						console.log('Record state starting.');
					};
					mediaRecord.onpause = function(){
						$rootScope.$broadcast('onPauseRecord', null);
						console.log('Record state pause.');
					};
					mediaRecord.onresume = function(){
						$rootScope.$broadcast('onResumeRecord', null);
						console.log('Record state resume.');
					};
					mediaRecord.onwarning = function(warning){
						$rootScope.$broadcast('onRecordWarning', warning);
						console.log('Record state warning: ' + warning);
					};
					mediaRecord.onstop = function(){
						console.log('Record state stop.');
						//El crear un objeto objectRecord es porque, ngRepeat detecta si
						//se a creado uno nuevo o no.

						//objectRecord = new Object();
						//objectRecord.blob = new Blob(chunks,{type:mediaRecord.mimeType});
						//objectRecord.dataUri = URL.createObjectURL(objectRecord.blob);

						objectRecord = new Object();
						objectRecord.blob = new Blob(chunks,{type:mediaRecord.mimeType});
						objectRecord.dataUri = URL.createObjectURL(objectRecord.blob);
						blobToB64(new Blob(chunks,{type:mediaRecord.mimeType}))
							.then(function(blob){
								objectRecord.blob64 = blob;
							});
						
			
						chunks = [];
						mediaRecord = null;
						$rootScope.$broadcast('onRecordStop', null);
					};
					mediaRecord.onerror = function(error){
						$rootScope.$broadcast('onRecordError', error);
						console.log('Record state error: ' + error);
					};
					mediaRecord.ondataavailable = function(event){
						$rootScope.$broadcast('onRecordDataavailable', {data: event.data});
						console.log('Record state data available.');

						//Quitar los trozos que no tiene datos.
						if(event.size != 0){ 
							//let reader = new FileReader();
							//Imprimir el contenido que entra.
							//reader.onloadend = function () {
							//	console.log(reader.result);
							//};
							//reader.readAsBinaryString(event.data);
							chunks.push(event.data);
						}
					};
				}
			}
		};

		var isSupport = function(){
			return Boolean(MStream && MRecord && Blob && URL && FReader);
		};
		var start = function(timeslice){
			timeslice = isNaN(timeslice)? 10: timeslice;
			
			//- Existe soporte para las diferentes API´s.
			//- Existe un objeto mediaRecord ya creado.
			//- El mediaRecord.state es inactive.
			if(isSupport() && mediaRecord){
				if(mediaRecord.state === 'inactive'){
					mediaRecord.start(timeslice);	
				}
			}
		};
		var stop = function(){
			var record_object = {};
			
			//- Existe soporte para las diferentes API´s.
			//- Existe un objeto mediaRecord.
			//- El mediaRecor.state es recording.
			if(isSupport() && mediaRecord){
				if(mediaRecord.state === 'recording'){
					mediaRecord.stop();
				}
			}
		};
		
		var blobToB64 = function(blob){
			return new Promise(function(resolve ,reject){
				var reader = new FReader();
				reader.onload = function(){
					var dataUrl = reader.result;
					var base64 = dataUrl.split(',')[1];
					resolve(base64);
				};
				reader.readAsDataURL(blob);
			});
		};

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

		return {
			isSupport: function(){ return isSupport(); }, //
			createRecord: function(mediaStream, options){ createRecord(mediaStream, options); },
			b64ToBlob: function(b64Data, contentType, sliceSize) { return b64ToBlob(b64Data, contentType, sliceSize); },
			blobToB64: function(blob) {return blobToB64(blob); },
			//getBlob: function(){ return objectRecord.blob; },
			//getDataUri: function(){ return objectRecord.dataUri; },
			getRecord: function(){ return objectRecord; }, 
			start: function(timeslice){ start(timeslice); },
			stop: function(){ stop(); }
		};
	}]);