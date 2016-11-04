//Configuración de los servicios y de la aplicacions.
angular.module('otisDemo')
	.config(['$routeProvider',function($routeProvider) {
		$routeProvider.when('/',{
			template:'<panel><features><h1>Hola<h1></features></panel>'
		}).when('/videocall',{
			template: '<video-call></video-call>'
		}).when('/mirroring',{
			template: '<mirroring></mirroring>'
		}).when('/videorecord',{
			template: '<video-record></video-record>'
		}).when('/audiorecord',{
			template: '<audio-record></audio-record>'
		}).otherwise({
			redirectTo: '/'
		});
	}]);


//Inicialización de la aplicacion.
angular.module('otisDemo').run(['$route', function($route){
	$route.reload();
}])