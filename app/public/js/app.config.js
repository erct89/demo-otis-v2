//Configuración de los servicios y de la aplicacions.
angular.module('otisDemo')
	.config(['$routeProvider',function($routeProvider) {
		$routeProvider.when('/',{
			template:'<features><h1>Hola<h1></features>'
		}).when('/videocall',{
			template: '<video-call></video-call>'
		}).when('/videocallrecord',{
			template: '<video-call-record></video-call-record>'
		}).when('/video/record',{
			template: '<media-record type="video"></media-record>'
		}).when('/audio/record',{
			template: '<media-record type="audio"></media-record>'
		}).otherwise({
			redirectTo: '/'
		});
	}]);


//Inicialización de la aplicacion.
angular.module('otisDemo').run(['$route', function($route){
	$route.reload();
}])