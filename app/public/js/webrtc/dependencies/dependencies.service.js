'use strict';

angular.module('webrtc')
	.factory('Dependencies',['DEPENDECIES','Util','$window', function (DEPENDECIES, Util, $window) {
		var supportDependencies = Util.getExitProperties(DEPENDECIES);
		var _window = $window;
		
		var separateProperty = function(fullNameProperty){
			var result = ( typeof(fullNameProperty) === 'string' )? fullNameProperty: undefined;

			if(fullNameProperty){
				return result.split(".");	
			}else{
				return result;
			}
		};

		return {
			getDependecies: function(){
				return DEPENDECIES;
			},
			getDependeciesSupport: function(){
				var result = [];
				var allDep = DEPENDECIES;
				var serparateDependency = null;

				allDep = Array.isArray(allDep)? allDep:undefined;

				if(allDep){
					if(allDep[0] ===  "window"){
						allDep = allDep.slice(1);
					}

					for(var dep of allDep){
						serparateDependency = separateProperty(dep);
						if( Util.isFullNameProperty(_window, serparateDependency) ){
							result.push(dep);
						}
					}
				}

				return result;
			},
			getDependecy: function(fullNameDependency){
				var result = null;
				var separateDependency = separateProperty(fullNameDependency);

				if(separateDependency){
					result = Util.getPropertyForFullName(_window,separateDependency);	
				}

				return result;
			}
		};
	}]);