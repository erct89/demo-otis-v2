angular.module('core').factory('App', ['APPSERVER','$http','$rootScope',function(APPSERVER,$http,$rootScope){
	var self = this;
	var url = APPSERVER.server + ':' + APPSERVER.port + APPSERVER.configUri;

	self.app = {
		name: 'demoOti',
		version: '2',
		author: ['Emilio Añover García'],
		logoUrl: './images/otislogo.svg',
		lastModification: new Date().getTime()
	}; // la configuracion por defecto.

	return {
		loadConfig: function(){
			$http.get(url).success(function(data){
				console.log("DESDE CORE.SERVICE");
				console.log(data);
				self.app = data;
				$rootScope.$broadcast('LoadedConfigApp');
			}).error(function(error){
				console.log("DESDE CORE.SERVICE");
				console.log(error);
				$rootScope.$broadcast('ErrorLoadConfigApp');
			});	
		},
		get: function (property) {
			return self.app[property];
		}
	};
}]);