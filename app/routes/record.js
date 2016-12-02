const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

let record = {};
record.files = null; //Variable que agiliza el servidor.

/*
	record.getRecords(req, res, next, type){
		- Description: La utilizo para cargar si es necesario la lista de ficheros de
		grabaciones que hay en el servidor. Para ello utilizo el parametro ':type' de
		la URL. El objeto de ficheros es cargaddo en el objeto 'record' en una propiedad
		llamada 'files'.
	}
*/
record.getRecords = function(req, res, next, type) {
	let pathfile = 'app\\public\\records\\';
	if(!record.files){
		getFilesDir(pathfile + 'audio',{encoding: 'utf8'}) //Cargar las grabaciones de audio.
			.then((files) => {
				console.log('Cargando Grabaciones de Audios:');
				console.log(files);
				record.files = {};
				record.files.audio = files || [];
				return getFilesDir(pathfile + 'video', {encoding: 'utf8'});
			}).then((files) => {
				console.log('Cargadas grabaciones de Video:');
				console.log(files);
				record.files.video = files || [];
				next();
			}).catch((error) => {
				console.log('Error en getRecords');
				next(error);
			});
	}else{
		next();
	}
};

/*
	record.getRecords(req, res, next, type){
		- Description: Utilizado para que cuando existe un parametro :id, cargemos el
		fichero que este :id indica.
	}
*/
record.getRecord = function(req, res, next, id) {
	//let pathfile = `app\\public\\records\\${req.param.type}`;
	req.file = inArray(record.files.audio, id);
	req.file = req.file || inArray(record.files.video, id);
	
	if(req.file){
		next();
	}else{
		console.log(`Error: File whose id is ${id} not found`);
		next(new Error(`File whose id is ${id} not found`));
	}
};

/*
	record.all(req, res){
		- Description: La uso para la siguiente URL: "../records/". Realiza la 
		busqueda de todos los ficheros de audio y video, si los encuentra retorna 
		un objeto con el siguiente formato: "{ audio: string[],	video: string[]	} ".
		  De ocurrir algun problema se envia un HTTP con status 404, con los datos 
		de error.
		> req: <HttpRequest>  Objeto que representa la peticion.
		> res: <HttpResponse> Objeto que representa la respuesta.
	}
*/
record.all = function(req, res){
	res.json(record.files);
};

/*
	record.list(req,res){
		- Description: La uso para atender la peticion "../records/:type". Realiza la 
		busqueda de todos los ficheros de un tipo (audio|video) y los retorna en 
		envuelto en un objeto con el sigueinte formato: 
		"{ audio: string[], video: string[] }".
		  De ocurrir algun problema se envia un HTTP con status 404, con los datos 
		de error.
		> req: <HttpRequest>  Objeto que representa la peticion.
		> res: <HttpResponse> Objeto que representa la respuesta.
	}
*/
record.list = function(req, res){
	res.json(record.files);
};

/*
	record.get(req.res){
		- Description: La uso para atender a la peticion Http que apunta a 
		"../record/:type/:id". 
		  Realiza la busqueda del fichero indicado por su 'type' y su 'id'. 
		  Si el fichero existe lo lee y lo envia en un json. De lo encotrarlo envia 
		una respuesta HTTP con Status 404, junto con el error.
		> req: <HttpRequest>  Objeto que representa la peticion.
		> res: <HttpResponse> Objeto que representa la respuesta.
	}
*/
record.get = function(req, res, next) {
	let type = req.params.type;
	let id = req.params.id;
	let pathfile = `app\\public\\records\\${type}\\${req.file}`;

	readFilesPromise(pathfile, {encoding:'Base64'})
		.then( data => {
			if(data){
				console.log(`Fichero ${pathfile} encontrado y enviado.`);
				res.json(data);
			}
		}).catch( error => {
			console.log(error);
			next(error);
		});
};

/*
	record.post(req, res){
		- Description: La uso para atender a la peticion Http POST que apunta a 
		"../record". 
		  Recibe un objeto 'data' con una propiedad 'blob64' que representa un Blob con
		en 'base64' y una propiedad 'name' que es el nombre del fichero.
		  Si el tipo es 'audio' lo convierte a formato 'ogg' y si es un video lo 
		separa en frames formato 'png'. Despues los guarda en su carpeta correspondiente
		de "app/public/records/[video|audio|screenshot]".
		  Cuando termina envia una respuesta HTTP con status 200 y un objeto con el nombre
		del fichero.
		> req: <HttpRequest>  Objeto que representa la peticion.
		> res: <HttpResponse> Objeto que representa la respuesta.
	}
*/
record.post = function(req, res){
	let blob64 = req.body.data.blob64;
	let name = req.body.data.name;
	let newName = null
	let type = req.params.type;
	let pathfile = `app\\public\\records\\${type}\\`;
	let buffer = Buffer.from(blob64,'Base64');
	
	fs.writeFile(pathfile + name, buffer, (error) => {
		if(error){
			res.status(404).send(error);		
		}else{
			if(type === 'audio'){
				//Convirtiendo el fichero opus a un fichero ogg.
				newName = req.body.data.name.match(/^audio_(\d{13})./)[0] + 'ogg';
				ffmpeg(pathfile + name)
					.on('error',(error)=>{
						console.log(error);
					}).on('end',() =>{
						console.log('Finalizado');
						deleteFile(__dirname +'\\..\\..\\' + pathfile + name)
							.then(()=>{
								res.send("OK");
								console.log('Delete: ' + __dirname +'\\..\\..\\' + pathfile + newName);
							}).catch((error) => {
								res.status(404).send(error);
								console.log('Can´t delete: ' + __dirname +'\\..\\..\\' + pathfile + newName);
							});
						
					}).save(__dirname +'\\..\\..\\' + pathfile + newName);
			}else if(type === 'video'){
				res.send("OK");
				newName = req.body.data.name.match(/^video_(\d{13})/)[0] + "_%06d.png";
	
				ffmpeg(__dirname +'\\..\\..\\' + pathfile + name)
					.fps(30)
					.outputOptions('-r 30')
					.on('error', error => {	console.log(error); })
					.on('end',()=>{ console.log("Finalizado ficheros generados."); })
					.save('app\\public\\records\\screenshot\\' + newName);
			}else{
				res.status(404).send(`${type} isn't supported, only audio or video`);
			}
		}
	});
};

/*
	record.delete(req, res){
		- Description: La uso para atender a la peticion Http DELETE que apunta a 
		"../record/:type/:id". Realiza la busqueda del fichero indicado por su
		'type' y su 'id'. Si el fichero existe lo borrar. 
		  Si el proceso se realiza se envia una respesta HTTP con Status 200.
		  De no encotrar el fichero o ocurrir algún error durante el borrado, se envia 
		una respuesta HTTP con Status 404, junto con el error.
	}
*/
record.delete =  function(req, res, next){
	let type = req.params.type;
	let pathfile = `app\\public\\records\\${type}\\${req.file}`;

	deleteFile(pathfile)
		.then(() => {
			console.log(`Delete File: ${pathfile}`);
			res.status(200).send();
			record.files = null; //Se podria no borrar y solo borrar el correspondiente.
		}).catch((error) => {
			console.log(`Error Delete File: ${pathfile}`);
			console.log(error);
			next(error);
		});
};


/*
	getFilesDir(path, options)
		- Description: Obtener la lista de ficheros que hay en un directorio.
		> path: <String> directorio donde hay que buscar.
		> options: <Object> {encoding: 'uft8'}
		< return: <Promise> Then(string []) o catch(error).
*/
var getFilesDir = function(pathfile, options) {
	return new Promise((resolve, reject) => {
		fs.readdir(pathfile, options,(error, files) => {
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
	return new Promise((resolve, reject) => {
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

/*
	readFilesPromise(pathfile, options){
		- Description: Envuelve el metodo fs.readFile como una promesa. 
		> pathfile: <string> ruta del fichero.
		> options: <object> Opciones que hay que pasar a fs.readFile().
		< return: <Promise> then(data) o catch(error). 
	}
*/
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


/*
	readFilesPromise(pathfile, options){
		- Description: Envuelve el metodo fs.readFile como una promesa. 
		> pathfile: <string> ruta del fichero.
		> options: <object> Opciones que hay que pasar a fs.readFile().
		< return: <Promise> then(data) o catch(error). 
	}
*/
var writeFilesPromise = function(pathfile, buffer){
	return new Promise((resolve,reject)=>{
		fs.writeFile(pathfile, buffer,(error, data)=>{
			if(error){
				reject(error);
			}else{
				resolve(data);
			}
		});
	});
};


/*
	deleteFile(pathfile){
		- Description: Borra el fichero al que referencia la ruta.
		> pathfile: <String> Direccion del fichero que hay que borrar.
		< return: <Promise> then() o catch(error)
	}
*/
//Borrar un fichero si es que existe.
var deleteFile = function(pathfile) {
	return new Promise((resolve, reject)=>{
		fs.unlink(pathfile, (error) => {
			if(error){
				reject(error);
			}else{
				resolve();
			}
		});
	});
};

/*
	inArray(array, string){
		- Description: Busca en un array un item que contenga el string pasado como 
		parametro, si lo encuentro lo retorna, sino retorna null.
		> array: <Array>
		> string: <String>
		< return: <String>||<null>
	}
*/
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