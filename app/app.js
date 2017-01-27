var express = require('express'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  ffmpeg = require('fluent-ffmpeg');

var routes = require('./routes');
var record = require('./routes/record.js');

var app = express();
var server = require('http').Server(app);
//var io = require('socket.io')(server);

//Capturando las peticiones de socket io.
//io.on('connection', socket => {
//  console.log("Socket - Creando la conexion.");
//  socket.emit("newconnected", "Welcome to socket!!");
//  socket.on('chunk', data => {
//    let buffer = Buffer.from(data);
//    let rStream = fs.createReadStream(buffer);
//    rStream.on('error', error => {
//      console.log(error);
//      });

		/*let command = ffmpeg()
      .input(rStream)
      .inputFormat('s16le')
      .on('error', error => {
        console.log(error);
      }).on('end', () => {
        console.log("Teminado el proceso");
      }).save("buffer.wav");*/
//      console.log("Datos recibidos");
//	});
//});

// Configurando el express.
app.set('views', path.join(__dirname, 'views')); //Directorio de las vistas.
app.set('view engine', 'ejs'); //Motor de plantillas.
app.set('port', process.env.PORT || 3000); //Puerto de escucha.


// Creando middlewares para:
app.use(bodyParser.json({limit: '100mb'})); //Cuando se reciben datos en el Body los parseanis a JSON.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //Eltableciendo el directorio estatico.
app.use((req, res, next) => {
	console.log(`Peticion: ${req.protocol}://${req.hostname}${req.baseUrl}${req.path}`);
	next();
});

app.param('type', record.getRecords);
app.param('id' , record.getRecord);
app.delete('/record/:type/:id', record.delete);
app.get('/record/:type/:id', record.get);
app.get('/record/:type', record.list);
app.post('/record/:type', record.post);
app.get('/record/', record.all);
app.get('/concat/:type', record.concat);
app.get('/', routes.index);

//Manejador de errores.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(404).json( {error: err} );
});



//Poniendo a escuchar el servidor.
server.listen(app.get('port'), function() {
});

module.exports = app;
