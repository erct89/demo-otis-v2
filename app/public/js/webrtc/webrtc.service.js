'use strict';

angular.module('webrtc').service('Util', [function(){
	var self = this;
/*
	getExitProperties(ref, properties)
		- Description: Se le pasa una referencia a un objeto 'ref' y un array de strings 'properties',
		y devuelve un array con las propiedades soportadas.
		> ref: <Object> referencia a un objeto.
		> properties: Array(String) lista de strings que definen las propiedades a buscar en la referencia.
		< return: Array<String> || Array<void> Si todo va bién devuelve una Array con las propiedades soportadas y sino un Array vacio.
*/
	self.getExitProperties = function(ref, properties){
		ref = typeof(ref) === "object"? ref: new Object();
		properties = ( typeof properties === 'string' )? [properties]: properties;
		properties = ( Array.isArray(properties) )? properties: [];
		var result = [];

		for(let property of properties){
			if(self.exitProperty(ref,property)){
				result.push(property);
			}
		}

		return result;
	};



/*
	exitProperty(ref, property)
		- Description: Permite saber si una propiedad esta contenida en un objeto.
		> ref: <Object> referencia al objeto donde hay que buscar la propiedad.
		> property: <String> propiedad a comporbar si exites.
		< return: <Boolean> true si la propiedad exite, y false si la propiedad no existe.
*/
	self.exitProperty = function(ref, property){
		return self.getProperty(ref,property) || false;
	};



/*
	getPropterty(ref,property)
		- Description: Obtener una propiedad, objeto u funcion de un objeto.
		> ref: <Object> Referencia al objeto en el cual buscar la propiedad.
		> propeerty: <String> Nombre de la propiedad a buscar.
		< return: < <Object> || null > El resultado de la propiedad, la refencia la objeto u funcion o si no
		existe un undefined.
*/
	self.getProperty = function(ref,property){
		var result = null;
		ref = (typeof(ref) === 'object')? ref: undefined;
		property = (typeof(property) === 'string')? property: undefined;
	
		if(ref && property){
			result = ref[property];
		}

		return result;
	};	



/*
	getProperties(ref)
		- Description: Obtiene las propiedades de un objeto pasado como referencia.
		> ref: Objeto del cual obtener la lista de propiedades.
		< return: Array<String> || Array<void> Array vacio si la referencia no es buena, o un Array<String> con las propiedades.
*/
	self.getProperties = function (ref) {
		ref = typeof(ref) === "object"? ref: {};
		let properties = [];

		for(let p in ref){
			if( typeof(p) === "string" ){
				properties.push(p);
			}
		}

		return properties;
	};



/*
	getPropertyForFullName(rootDep, arrayProperties)
		- Description: Obtener la propiedad o referenca indicada en el array, si se recibe:
			rootDep = window;
			arrayProperties: ["navigator","mediaDevices"]
			return  window.navigator.mediaDevices
		> rootDep: Es el padre desde el que se busca la propiedad.
		> arrayProperties: Array<String> lista de propiedades ex: ["window","navigator"]
		< return: < <Object>|null > la referencia a la propiedad indicada.  
*/
	self.getPropertyForFullName = function(rootDep, arrayProperties){
		var result = null;
		var depRef = rootDep || new Object();
		arrayProperties = Array.isArray(arrayProperties)?arrayProperties:undefined;

		if(arrayProperties){
			if(arrayProperties[0].toLowerCase() === depRef.constructor.name.toLowerCase()){
				arrayProperties.splice(0,1);
			}

			for(var property of arrayProperties){
				depRef = self.getProperty(depRef, property);
				if(!depRef){
					break;
				}
			}
			result = depRef;
		}

		return result;
	};



/*
	isFullNameProperty(rootDep, arrayProperties)
		- Description: Saber si una lista de String se corresponde con una propiedad.
		> rootDep: <Object> Referencia desde donde hay que empezar a buscar.
		> arrayProperties: Array<String> lista de propiedades que se corresponde a el nombre
		completo de una propiedad.
		< return: <Boolean> si la pripiedad existe retorna true, de lo contrario false.
*/
	self.isFullNameProperty = function (rootDep, arrayProperties){
		var depRef = rootDep || {};
		arrayProperties = Array.isArray(arrayProperties)?arrayProperties:undefined;

		if(arrayProperties){
			for(var property of arrayProperties){
				depRef = self.getProperty(depRef, property);
				if(!depRef){
					return false;
				}
			}
		}

		return true;
	};



/*
	differenceArray(all,minus)
		- Description: Obtener la diferencia entre dos arrays.
		> all: Array<*>
		> minus: Array<*>
		< return: Array<*> Un array con los objetos diferentes entre los dos  arrays.
*/
	self.differenceArray = function(all, minus){
		var result = null;
		all = Array.isArray(all)? all: undefined;
		minus = Array.isArray(minus)? minus: undefined;

		if( all && minus ){
			if(all.length < minus.length){
				result = all;
				all = minus;
				minus = result;
			}
			
			result = [];
			for(var item of all){
				if(minus.indexOf(item) === -1){
					result.push(item);
				}
			}
		}else if( !all && minus ){
			result = minus;
		}else if( all && !minus ){
			result = all;
		}

		return result;
	};


	/*
	generateString(seeder, prefix, subfix, separator)
		- Description: Funcion para generar un string con un prefijo, un subfijo y con separadores;
		> seeder: [<Function> || new Date().getTime] semilla que genera el contenido del string.
		> prefix: [<String> || '_'];
		> subfix: [<String> || ''];
		> [separator]: [<Object> || {top:'_',bottom:''}];  
		< return: <String> prefix + (separator.top|'_') + seeder + (separator.bottom|'') + subfix
	*/
	self.generateString = function (seeder,prefix,subfix,separator){
		var _separator = { top: "", bottom: ""};
		var _seeder = (typeof seeder === "string")? seeder: null;
		_seeder = ( (_seeder === null) && (typeof(seeder) === "function") )? seeder(): new Date().getTime().toString();
		_seeder = (typeof _seeder === "string")? _seeder: "";
		prefix = (typeof prefix === "string")? prefix: "";
		subfix = (typeof subfix === "string")? subfix: "";
		switch(typeof separator){
			case "string":
				_separator.top = _separator.bottom = separator;
			break;
			case "object":
				_separator.top = (typeof separator.top === "string")?separator.top :"";
				_separator.bottom = (typeof separator.bottom === "string")? separator.bottom :"";
			break;
		}
		
		return prefix + _separator.top + _seeder + _separator.bottom + subfix;
	};

	/*
	jsonConcat(json,other_json)
		- Description: Une dos json en uno.
		> json, other_json: <JSON> Objettos json a ser unidos.
		< return: <JSON> json + other_json. 
	*/
	self.jsonConcat = function(json, other_json){
		var result = null;
		json = json || {};
		result = other_json = other_json || {};

		for(let property in json){
			result[property] = json[property];
		}

		return result;
	};
}]);