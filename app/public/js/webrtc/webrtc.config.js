angular.module('webrtc')
	.config(['$compileProvider',function($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript|blob):/);
	}]);

angular.module('webrtc')
	.run(['Util', 'Devices', function(Util, Devices){
		Devices.loadDevices().then(function(devicesInfo){
			Devices.devices = devicesInfo;
		}).catch(function(err){
			console.log(err);
		});
	}]);