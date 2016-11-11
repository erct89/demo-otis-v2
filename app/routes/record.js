var fs = require('fs');
var record = {};

record.all = function(req, res){
	var recs = {audio:[],video:[]};
	
	getFileDir('app\\records\\audio',{encoding: 'utf8'})
		.then(function(files) {
			recs.audio = files || [];
			return getFileDir('app\\records\\video', {encoding: 'utf8'});
		}).then(function(files) {
			recs.video = files || [];
			res.json(recs);
		}).catch(function(err) {
			res.json({error: err});
		});
};
record.list = function(req, res){
	var type = req.params.type || null;
	var url = `app\\records\\${type}`;
	var recs = {};
	
	if(type){
		recs[type] = [];
		console.log("URL");
		console.log(url);
		getFileDir(url,{encoding:'utf8'})
			.then(function(files) {
				recs[type] = files;
				res.json(recs);
			}).catch(function(err) {
				res.json(err);
			});
	}else{
		res.json({error: "Tipo no permitido."});
	}
};

record.get = function(req, res) {
	var type = req.params.type;
	var id = req.params.id;
	res.send("Recibido GET");
};
record.post = function(req, res){
	var blob64 = req.body.data.blob64;
	var name = req.body.data.name;
	var type = req.params.type;
	var url = `app\\records\\${type}\\${name}`;
	var buffer = Buffer.from(blob64,'Base64');
	
	fs.writeFile(url,buffer,function(err){
		if(err){
			res.send(err);		
		}else{
			res.send("OK");
		}
	});

	
};
record.delete =  function(req, res){
	res.send('Recibido DELETE');
};

var getFileDir = function(dir, options) {
	return new Promise(function(resolve, reject){
		fs.readdir(dir,options,function(err, files){
			if(err){
				reject(err);
			}

			resolve(files);
		});
	});
};

exports.record = record;