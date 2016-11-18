const fs = require('fs');
const path = require('path');

var record = {};

record.all = function(req, res){
	var recs = {audio:[],video:[]};
	
	getFilesDir('app\\records\\audio',{encoding: 'utf8'})
		.then(function(files) {
			recs.audio = files || [];
			return getFilesDir('app\\records\\video', {encoding: 'utf8'});
		}).then(function(files) {
			recs.video = files || [];
			res.json(recs);
		}).catch(function(err) {
			res.status(404).json({error: err});
		});
};

record.list = function(req, res){
	var type = req.params.type || null;
	var url = `app\\records\\${type}`;
	var recs = {};
	
	if(type){
		recs[type] = [];
		getFilesDir(url,{encoding:'utf8'})
			.then(function(files) {
				recs[type] = files;
				res.json(recs);
			}).catch(function(err) {
				res.status(404).json(err);
			});
	}else{
		res.status(404).json({error: "Tipo no permitido."});
	}
};

record.get = function(req, res) {
	var type = req.params.type;
	var id = req.params.id;
	var dir = `app\\records\\${type}`;
	var fileName = null;

	getFilesDir(dir,{encoding:'utf8'})
		.then(function(files) {
			fileName = inArray(files,id);
			if(fileName){
				dir += `\\${fileName}`;
				fs.readFile(dir, {encoding:'Base64'}, function(err, data){
					if(err){
						res.status(404).json({error: err});
					}else{
						res.json(data);
					}
				});
			}else{
				res.status(404).json({error:`File whose id is ${id} not found`});
			}
		}).catch(function(err) {
			res.status(404).json({error: `File whose id is ${id} not found`});
		});
};

record.post = function(req, res){
	var blob64 = req.body.data.blob64;
	var name = req.body.data.name;
	var type = req.params.type;
	var url = `app\\records\\${type}\\${name}`;
	var buffer = Buffer.from(blob64,'Base64');
	
	fs.writeFile(url,buffer,function(err){
		if(err){
			res.status(404).send(err);		
		}else{
			res.send("OK");
		}
	});
};

record.delete =  function(req, res){
	var type = req.params.type;
	var id = req.params.id;
	var dir = `app\\records\\${type}`;
	var fileName = null;

	getFilesDir(dir, {encoding:'utf8'})
		.then(function(files) {
			fileName = inArray(files,id);

			if(fileName){
				dir += `\\${fileName}`;
				fs.unlink(dir, function(err){
					if(err){
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
	getFilesDir(dir, options)
		- Description: Obtener la lista de ficheros que hay en un directorio.
		> dir: <String> directorio donde hay que buscar.
		> options: <Object> {encoding: 'uft8'}
		< return: <Array> Lista con los nombres contenidos en el directorio.
*/
var getFilesDir = function(dir, options) {
	return new Promise(function(resolve, reject){
		fs.readdir(dir,options,function(err, files){
			if(err){
				reject(err);
			}

			resolve(files);
		});
	});
};

/*
	getFilesDatas(dir, filesNames, options)
		- Description: Devuelve los datos contenidos dentro de un array de ficheros.
		> dir: <String> Path donde hay que buscar los ficheros.
		> filesNames: <Array <String> > Lista de ficheros.
		> options: <Object> Opciones que hay que pasar a fs.readFile().
		< return: <Promise>
*/
var getFilesDatas = function(dir, filesNames, options){
	dir = (typeof(dir)==='string')? dir: '';
	filesNames = Array.isArray(filesNames)? filesNames: [];
	return new Promise(function(resolve, reject){
		var files = [];
		for(let fileName of filesNames){
			let pathfile = path.normalize(dir + fileName);
			let fileInfo = fs.statSync(pathfile);
			
			if(fileInfo.isFile()){
				files.push(readFilesPromise(pathfile,{encoding: 'Base64'})); 
			}
		}

		Promise.all(files)
			.then((datas)=>{
				console.log(datas);
				resolve(datas);
			}).catch((error)=>{
				console.log(error);
				reject(error);
			});
	});
};

//Envuelve el metodo fs.readFile en un fichero
var readFilesPromise = function(path, options){
	return new Promise((resolve,reject)=>{
		fs.readFile(path,options,(error, data)=>{
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