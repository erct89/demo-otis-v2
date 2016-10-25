//Configuración de los servicios y de la aplicacions.
angular.module('otisDemo')
	.config(['$routeProvider',function($routeProvider) {
		$routeProvider.when('/videocall',{
			template: '<div><video-call></video-call></div>'
		}).when('/mirroring',{
			template: '<div><mirroring></mirroring></div>'
		}).when('/videorecord',{
			template: '<div><video-record></video-record></div>'
		}).when('/audiorecord',{
			template: '<div><audio-record></audio-record></div>'
		}).otherwise({
			redirectTo: '/videorecord'
		});

	}]);


//Inicialización de la aplicacion.
angular.module('otisDemo').run(['$route', function($route){
	$route.reload();
}])