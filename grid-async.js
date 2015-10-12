var Config = require('./config');

var app = require('http').createServer(http_handler);
var io = require('socket.io')(app);
var fs = require('fs');
var _ = require("underscore");
var Connection = require("./grid_connection");
var backend=require("./grid_backend");

var authors=require('./grid_authors');
var locking=require("./grid_locking");
var pasteboard=require('./grid_pasteboard');
var modules=[new locking(),new authors(),new pasteboard()];

app.listen(Config.port);

/**
 * http request http_handler
 * TODO: handle ajax requests (lateron if socketio needs an outside fallback)
 */
function http_handler (req, res) {
}

/**
 * websocket requests
 * 
 */

io.on('connection', function (socket) {
	var conn=new Connection(socket);
	backend.DATA.CONNECTIONS.push(conn);
	console.log("Connected. "+backend.DATA.CONNECTIONS.length+" Connections open.");
	_.each(modules,function(module,index,_modules){
		module.connected(conn);
	});
	/**
	* connection lost to user
	* 
	*/
	socket.on('disconnect', function (reason) {
		console.log("Disconnected.");
		_.each(modules,function(module,index,_modules){
			module.disconnected(conn);
		});
		backend.DATA.CONNECTIONS=_.without(backend.DATA.CONNECTIONS,conn);
		console.log("Disconnected. "+backend.DATA.CONNECTIONS.length+" Connections open.");
	});
});

