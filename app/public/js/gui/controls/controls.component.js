'use strict';

angular.module('gui.controls')
	.component('controls',{
		templateUrl: 'js/gui/controls/controls.template.html',
		controller: ['$rootScope','Window',function ControllerControls($rootScope, Window) {
			var self = this;
			
			self.minimizeWindow = function(){
				$rootScope.$broadcast('onWindowStateChange',{state: "minimize"});
				Window.minimize();
			}; 
			self.toggleMaximizeWindow = function(){
				switch(Window.windowState){
					case 'maximize':
						Window.windowState = 'unmaximize';
						Window.unmaximize();
					break;
					default:
						Window.windowState = 'maximize';
						Window.maximize();
					break;
				}
			};
			self.closeWindow = function(){
				Window.close();
			};
		}]
	});