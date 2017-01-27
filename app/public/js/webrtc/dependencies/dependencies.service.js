'use strict';

angular.module('webrtc')
	.factory('Dependencies',['DEPENDECIES','Util','$window', function (DEPENDECIES, Util, $window) {
		var supportDependencies = Util.getExitProperties(DEPENDECIES);
		var _dependencies = {}; //Almacenamos todas las dependencias que se han ido pidiendo, para no tener que obtener una nueva referencia todo el tiempo.
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
			getDependencies: function(){
				return DEPENDECIES;
			},
			getDependenciesSupport: function(){
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
			getDependency: function(fullNameDependency){
				var result = null;
				var separateDependency = separateProperty(fullNameDependency);

				if(_dependencies[fullNameDependency]){
					return _dependencies[fullNameDependency];
				}

				if(separateDependency){
					result = Util.getPropertyForFullName(_window,separateDependency);
					if(result){
						_dependencies[fullNameDependency] = result;
					}	
				}

				return result;
			},
			getAllDependencies: function() {
				return _dependencies;
			}
		};
	}]);