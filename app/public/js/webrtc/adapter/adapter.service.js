'use strict'

angular.module('webrtc').factory('AdapterJS', ['$window', function($window){
	return $window.AdapterJS;
}])