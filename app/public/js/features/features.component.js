'use strict';

angular.module('features').component('features',{
	templateUrl: 'js/features/features.template.html',
	controller: ['$window',
		'AdapterJS', 
		'Plataform', 
		'Dependencies', 
		'Devices',
		'Util',
		function($window, AdapterJS, Plataform, Dependencies, Devices, Util){
			var self = this;

			var loadDependencies = function(){
				var dif = Dependencies.getDependecies(); 
				var support = Dependencies.getDependeciesSupport();

				dif = Util.differenceArray(dif, support);

				support = support.map(function(item){
					return setObjectDependencies(item,"support", true);
				});
				dif = dif.map(function(item){
					return setObjectDependencies(item,"support", false);
				});

				return support.concat(dif);
			};

			var setObjectDependencies = function(depName, field, value){
				var item = {};
				depName = typeof(depName) === 'string'? depName: null;
				field = typeof(field) === 'string'? field: null;
				
				if(depName && field){
					item.name = depName;
					item[field] = value;
				}

				return item;
			};

			var loadDevices = function(){
				var devices = $window.navigator.mediaDevices;

				if(devices){
					devices.enumerateDevices().then(function(devicesInfo){
						self.devices = devicesInfo;
					}).catch(function(err){
						self.devices = [];
					});
				}
			}

			//Propiedades publicas.
			self.os = Plataform.getOS();
			self.browser = Plataform.getBrowser();
			self.languages = Plataform.getLanguages();
			self.screen =  Plataform.getScreen();
			self.dependencies = loadDependencies();
			self.devices = Devices.devices;
	}]
});