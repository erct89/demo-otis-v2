'use strict';

angular.module('gui.panel').component('panel',{
	transclude: true,
	template: '<div class="gui-panel"><ng-transclude></ng-transclude></div>',
	controller: [function(){
		var self = this;
	}],
});