angular.module('webrtc')
	.config(['$compileProvider',function($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript|blob):/);
	}]);

angular.module('webrtc')
	.run(['Util', 'Devices', function(Util, Devices){
		//Obteniedo los diferentes dispositivos.
		Devices.loadDevices().then(function(devicesInfo){
			var all_devices = devicesInfo;
			//No todos los dispositivos que hay en devicesInfo son realmente
			//devices, solo aquellos cullo deviceId es una cadena alfanumerica de
			//64 caracteres.
			for(let device of all_devices){ 
				if(device.deviceId && (device.deviceId.match(/^[\d|a-z]{64}$/))){
					Devices.devices.push(device);
				}
			}

			//Aprovechando que estan cargados los dispositivos, obtenemos tambien las diferenes
			//restriciones, que son posibles.
			Devices.constraints = Devices.loadConstraints(devicesInfo);
		}).catch(function(err){
			console.log(err);
		});
	}]);