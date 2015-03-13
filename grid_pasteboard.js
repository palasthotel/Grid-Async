var backend=require('./grid_backend');
var _ = require("underscore");
var notificationCenter=require('./grid_notifications');

var pasteboard={};

module.exports=function(){
	
	notificationCenter.on("joined",function(conn){
		if(typeof(pasteboard[conn.author])!=='undefined')
		{
			conn.emit("pasteboard.content",pasteboard[conn.author]);
		}
	});
	
	this.connected=function(conn) {
		conn.on("pasteboard.copy",function(data){
			pasteboard[conn.author]=data;
			_.each(backend.DATA.CONNECTIONS,function(_conn,idx,_list){
				if(_conn.author==conn.author)
				{
					_conn.emit("pasteboard.content",data);
				}
			});
		});
	}
	
	this.disconnected=function(conn) {
		
	}
}