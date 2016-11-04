angular.module('webrtc')
	.filter('dataurl',['$sce',function($sce) {
		return function(data){
			return $sce.getTrustedResourceUrl(data);
		};
	}]);