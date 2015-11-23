
module.exports = function(plug){

	var _ = require("underscore");
	var EventEmitter = require('events').EventEmitter;
	var self = this;

	/**
	 * vars
	 */
	var _backend = null;
	var _notification = null;
	var _authors = null;
	var _events = new EventEmitter();

	/**
	 * init event tracking on plug ready
	 */
	plug.get_notification().on('ready', ready);
	function ready(){
		_backend = plug.get_plugin("backend");
		_notification = plug.get_notification();
		_notification.on('connected', _connected);
		_notification.on('disconnected', _disconnected);

		_authors = plug.get_plugin('authors');
		_authors.on_joined(_authors_joined);
	}

	function _connected(conn)
	{
		conn.hasLock=false;
		conn.lockRequests=[];
		conn.on("locking.requestLock",function(data){
			_backend.each(conn,function(_conn){
				if(_conn.hasLock)
				{
					_conn.emit("locking.lockRequested",{identifier: conn.identifier});
				}
			});
		});
		conn.on("locking.handover",function(data){
			if(!conn.hasLock)return;
			_backend.each(conn,function(_conn){
				if(_conn.identifier==data)
				{
					_conn.hasLock=true;
					conn.hasLock=false;
					_backend.emit(_conn,'locking.isLocked',{isLocked:true,identifier:_conn.identifier});
					_conn.emit("locking.isLocked",{isLocked:false});
				}
			});
		});
		conn.on("locking.denyHandover",function(data){
			if(!conn.hasLock)return;
			_backend.each(conn,function(_conn){
				if(_conn.identifier==data)
				{
					_conn.emit("locking.isLocked",{isLocked:true,identifier:conn.identifier});
				}
			});
		});
	}
	
	function _disconnected(conn)
	{
		if(conn.hasLock)
		{
			var hit=null;
			_backend.each(conn,function(_conn){
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

	function _authors_joined(conn){
		var locked=false;
		var locker=null;
		_backend.each(conn,function(_conn){
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
	}
}