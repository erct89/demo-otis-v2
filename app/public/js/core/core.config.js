//Inicializando la configuracion de la aplicacion.
angular.module('core').run(['App',function(App) {
	App.loadConfig();
}]);