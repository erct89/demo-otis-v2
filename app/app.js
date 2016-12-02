var express = require('express'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  ffmpeg = require('fluent-ffmpeg');

var routes = require('./routes');
var record = require('./routes/record.js').record;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.param('type',record.getRecords);
app.param('id' , record.getRecord);
app.delete('/record/:type/:id', record.delete);
app.post('/record/:type', record.post);
app.get('/record/:type/:id', record.get);
app.get('/record/:type',record.list);
app.get('/record/',record.all);
app.get('/', routes.index);

//Manejador de errores.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(404).json( {error: err} );
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
	// log a message to console!
});

module.exports = app;
