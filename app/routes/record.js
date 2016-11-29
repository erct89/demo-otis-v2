const fs = require('fs');
const path = require('path');

var record = {};

record.all = function(req, res){
	let recs = {audio:[],video:[]};
	let pathfile = 'app\\public\\records\\';

	getFilesDir(pathfile + 'audio',{encoding: 'utf8'})
		.then(function(files) {
			recs.audio = files || [];
			return getFilesDir(pathfile + 'video', {encoding: 'utf8'});
		}).then(function(files) {
			recs.video = files || [];
			res.json(recs);
		}).catch(function(error) {
			res.status(404).json({"error": error});
		});
};

record.list = function(req, res){
	let type = req.params.type || null;
	let pathfile = `app\\public\\records\\${type}`;
	let recs = {};
	
	if(type){
		recs[type] = [];
		getFilesDir(pathfile,{encoding:'utf8'})
			.then(function(files) {
				recs[type] = files;
				res.json(recs);
			}).catch(function(error) {
				res.status(404).json(error);
			});
	}else{
		res.status(404).json({"error": "Tipo no permitido."});
	}
};

record.get = function(req, res) {
	let type = req.params.type;
	let id = req.params.id;
	let pathfile = `app\\public\\records\\${type}`;
	let fileName = null;

	getFilesDir(pathfile,{encoding:'utf8'})
		.then(function(files) {
			fileName = inArray(files,id);
			if(fileName){
				pathfile += `\\${fileName}`;
				fs.readFile(pathfile, {encoding:'Base64'}, function(error, data){
					if(error){
						res.status(404).json({"error": error});
					}else{
						res.json(data);
					}
				});
			}else{
				res.status(404).json({"error":`File whose id is ${id} not found`});
			}
		}).catch(function(error) {
			res.status(404).json({"error": `File whose id is ${id} not found`});
		});
};

record.post = function(req, res){
	let blob64 = req.body.data.blob64;
	let name = req.body.data.name;
	let type = req.params.type;
	let pathfile = `app\\public\\records\\${type}\\${name}`;
	let buffer = Buffer.from(blob64,'Base64');
	
	fs.writeFile(pathfile,buffer,function(error){
		if(error){
			res.status(404).send(error);		
		}else{
			res.send("OK");
		}
	});
};

record.delete =  function(req, res){
	var type = req.params.type;
	var id = req.params.id;
	var pathfile = `app\\public\\records\\${type}`;
	var fileName = null;

	getFilesDir(pathfile, {encoding:'utf8'})
		.then(function(files) {
			fileName = inArray(files,id);

			if(fileName){
				pathfile += `\\${fileName}`;
				fs.unlink(pathfile, function(error){
					if(error){
						res.status(404).send();
					}else{
						res.status(200).send();
					}
				});
			}else{
				res.status(404).send("File unknow, can´t delete");
			}
		}).catch(function(error) {
			res.status(404).send();
		});
};


/*
	getFilesDir(path, options)
		- Description: Obtener la lista de ficheros que hay en un directorio.
		> path: <String> directorio donde hay que buscar.
		> options: <Object> {encoding: 'uft8'}
		< return: <Array> Lista con los nombres contenidos en el directorio.
*/
var getFilesDir = function(pathfile, options) {
	return new Promise(function(resolve, reject){
		fs.readdir(pathfile, options,function(error, files){
			if(error){
				reject(error);
			}
			resolve(files);
		});
	});
};

/*
	getFilesDatas(pathfile, filesNames, options)
		- Description: Devuelve los datos contenidos dentro de un array de ficheros.
		> pathfile: <String> Path donde hay que buscar los ficheros.
		> filesNames: <Array <String> > Lista de ficheros.
		> options: <Object> Opciones que hay que pasar a fs.readFile().
		< return: <Promise>
*/
var getFilesDatas = function(pathfile, filesNames, options){
	pathfile = (typeof(pathfile)==='string')? pathfile: '';
	filesNames = Array.isArray(filesNames)? filesNames: [];
	return new Promise(function(resolve, reject){
		var files = [];
		for(let fileName of filesNames){
			let pathfile = path.normalize(pathfile + fileName);
			let fileInfo = fs.statSync(pathfile);
			
			if(fileInfo.isFile()){
				files.push(readFilesPromise(pathfile,{encoding: 'Base64'})); 
			}
		}

		Promise.all(files)
			.then((datas)=>{
				resolve(datas);
			}).catch((error)=>{
				console.log(error);
				reject(error);
			});
	});
};

//Envuelve el metodo fs.readFile en un fichero
var readFilesPromise = function(pathfile, options){
	return new Promise((resolve,reject)=>{
		fs.readFile(pathfile,options,(error, data)=>{
			if(error){
				reject(error);
			}else{
				resolve(data);
			}
		});
	});
};

//encontrar el primer elemento del array que contiene string.
var inArray = function(array, string){
	array = Array.isArray(array)?array:null;
	string = typeof(string) === 'string'? string: null;
	
	if(string && array){
		for(let item of array){
			if(item.indexOf(string) > -1){
				return item;
			}
		}
	}
	return null;
};

exports.record = record;