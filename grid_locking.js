var backend=require('./grid_backend');
var _ = require("underscore");
var notificationCenter=require('./grid_notifications');

module.exports=function(){
	
	notificationCenter.on('joined',function(conn){
		var locked=false;
		var locker=null;
		backend.each(conn,function(_conn){
			if(_conn.hasLock)
			{
				locked=true;
				locker=_conn;
			}
		});
		if(!locked)
		{
			conn.hasLock=true;
			conn.emit("locking.isLocked",{isLocked:locked});
		}
		else
		{
			conn.emit("locking.isLocked",{isLocked:locked,identifier:locker.identifier});
		}
	});
	
	this.connected=function(conn)
	{
		conn.hasLock=false;
		conn.lockRequests=[];
		conn.on("locking.requestLock",function(data){
			backend.each(conn,function(_conn){
				if(_conn.hasLock)
				{
					_conn.emit("locking.lockRequested",conn.identifier);
				}
			});
		});
		conn.on("locking.handover",function(data){
			if(!conn.hasLock)return;
			backend.each(conn,function(_conn){
				if(_conn.identifier==data)
				{
					_conn.hasLock=true;
					conn.hasLock=false;
					backend.emit(_conn,'locking.isLocked',{isLocked:true,identifier:_conn.identifier});
					_conn.emit("locking.isLocked",{isLocked:false});
				}
			});
		});
		conn.on("locking.denyHandover",function(data){
			if(!conn.hasLock)return;
			backend.each(conn,function(_conn){
				if(_conn.identifier==data)
				{
					_conn.emit("locking.isLocked",{isLocked:true,identifier:conn.identifier});
				}
			});
		});
	}
	
	this.disconnected=function(conn)
	{
		if(conn.hasLock)
		{
			var hit=null;
			backend.each(conn,function(_conn){
				if(hit==null)
				{
					hit=_conn;
					_conn.hasLock=true;
					_conn.emit("locking.isLocked",{isLocked:false});
				}
				else
				{
					_conn.emit("locking.isLocked",{isLocked:true,identifier:hit.identifier});
				}
			});
		}
	}
}