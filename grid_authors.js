var backend=require('./grid_backend');
var _ = require("underscore");
var notificationCenter=require('./grid_notifications');
var uuid=require('node-uuid');

module.exports=function AuthorsModule() {
	this.connected=function(conn) {
		conn.on("authors.join",function(data){
			conn.joined=true;
			console.log("user connected! "+JSON.stringify(data));
			conn.author=data.author;
			conn.identifier=uuid.v1();
			conn.domain=data.domain;
			conn.path=data.path;
			backend.ensureDomainAndPath(data.domain,data.path);
			backend.DATA.DOMAINS[conn.domain][conn.path].push(conn);
			var usersJoined=[];
			_.each(backend.DATA.DOMAINS[conn.domain][conn.path],function(_conn,idx,_path){
				if(_conn===conn)return;
				usersJoined.push({author:_conn.author,identifier:_conn.identifier});
			});
			backend.emit(conn,"authors.joined",{author:conn.author,identifier:conn.identifier});
			console.log("Authorlist emitted: "+JSON.stringify(usersJoined));
			conn.emit("authors.list",usersJoined);
			notificationCenter.emit('joined',conn);
		});
	}
	this.disconnected=function(conn) {
		if(conn.joined){
			backend.emit(conn,"authors.left",conn.identifier);
			backend.DATA.DOMAINS[conn.domain][conn.path]=_.without(backend.DATA.DOMAINS[conn.domain][conn.path],conn);
			backend.cleanup();
		}
	}
}