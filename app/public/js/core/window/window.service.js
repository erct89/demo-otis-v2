angular.module('core.window').factory('Window', ['NW', function(NW){
	var wnd = NW.Window.get();
	wnd.windowState = "unmaximize";
	return wnd;
}]);