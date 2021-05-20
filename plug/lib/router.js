
var _ = require('underscore');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser')

module.exports = Router;

function Router(config){

	var _config = _.extend({
		port: 80,
		timeout: 2 * 60 * 1000,
	},config);

	this.express = express;
	this.socketio = socketio;

	var app = express();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	var server = app.listen(_config.port, ()=>{
		console.debug("Listeing on port", _config.port)
	});
	server.setTimeout(_config.timeout);
	var io = socketio(server, _config.socketio);

	this.http = function(){
		return app;
	}
	this.ws = function(){
		return io;
	}

	this.set_static_path = function(path, folder){
		app.use(path, express.static(folder));
	}

	this.close = function(){
		server.close();
	}
}