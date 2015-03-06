
var app = require('http').createServer(http_handler);
var io = require('socket.io')(app);
var fs = require('fs');
var _ = require("underscore");
var Connection = require("./grid_connection");
var backend=require("./grid_backend");

app.listen(61000);

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
	socket.on('authors.join', function(data){
		conn.joined=true;
		console.log("user connected! "+JSON.stringify(data));
		conn.author=data.author;
		conn.domain=data.domain;
		conn.path=data.path;
		backend.ensureDomainAndPath(data.domain,data.path);
		backend.DATA.DOMAINS[conn.domain][conn.path].push(conn);
		var usersJoined=[];
		_.each(backend.DATA.DOMAINS[conn.domain][conn.path],function(_conn,idx,_path){
			if(_conn===conn)return;
			usersJoined.push(_conn.author);
		});
		backend.emit(conn,"authors.joined",conn.author);
		console.log("Authorlist emitted: "+JSON.stringify(usersJoined));
		conn.emit("authors.list",usersJoined);
	});
	
	/**
	* connection lost to user
	* 
	*/
	socket.on('disconnect', function (reason) {
		console.log("Disconnected.");
		if(conn.joined){
			backend.emit(conn,"authors.left",conn.author);
			backend.DATA.DOMAINS[conn.domain][conn.path]=_.without(backend.DATA.DOMAINS[conn.domain][conn.path],conn);
			backend.cleanup();
		}
		backend.DATA.CONNECTIONS=_.without(backend.DATA.CONNECTIONS,conn);
		console.log("Disconnected. "+backend.DATA.CONNECTIONS.length+" Connections open.");
	});
});

