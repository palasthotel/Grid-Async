
var app = require('http').createServer(http_handler);
var io = require('socket.io')(app);
var fs = require('fs');
var _ = require("underscore");
var Connection = require("./grid_connection");

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

var DATA={
	CONNECTIONS:[],
	DOMAINS:{}
}

io.on('connection', function (socket) {
	var conn=new Connection(socket);
	DATA.CONNECTIONS.push(conn);
	console.log("Connected. "+DATA.CONNECTIONS.length+" Connections open.");
	socket.on('users.join', function(data){
		conn.joined=true;
		console.log("user connected! "+JSON.stringify(data));
		conn.author=data.author;
		conn.domain=data.domain;
		conn.path=data.path;
		if(typeof(DATA.DOMAINS[conn.domain])=='undefined')
		{
			DATA.DOMAINS[conn.domain]={};
		}
		if(typeof(DATA.DOMAINS[conn.domain][conn.path])=='undefined')
		{
			DATA.DOMAINS[conn.domain][conn.path]=[];
		}
		DATA.DOMAINS[conn.domain][conn.path].push(conn);
		var usersJoined=[];
		_.each(DATA.DOMAINS[conn.domain][conn.path],function(_conn,idx,_path){
			if(_conn===conn)return;
			_conn.socket.emit("users.joined",conn.author);
			usersJoined.push(_conn.author);
		});
		console.log("UserList emitted: "+JSON.stringify(usersJoined));
		conn.socket.emit("users.list",usersJoined);
	});
	
	/**
	* connection lost to user
	* 
	*/
	socket.on('disconnect', function (reason) {
		console.log("Disconnected.");
		if(conn.joined){
			_.each(DATA.DOMAINS[conn.domain][conn.path],function(_conn,_author,_path){
				if(_conn===conn)return;
				_conn.socket.emit("users.left",conn.author);
			});
			DATA.DOMAINS[conn.domain][conn.path]=_.without(DATA.DOMAINS[conn.domain][conn.path],conn);
			if(DATA.DOMAINS[conn.domain][conn.path]==[])
			{
				delete DATA.DOMAINS[conn.domain][conn.path];
				if(DATA.DOMAINS[conn.domain]=={})
				{
					delete DATA.DOMAINS[conn.domain];
				}
			}
		}
		DATA.CONNECTIONS=_.without(DATA.CONNECTIONS,conn);
	console.log("Disconnected. "+DATA.CONNECTIONS.length+" Connections open.");
	});
});

