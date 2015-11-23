
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
	var pasteboard={};

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

	function _authors_joined(conn){
		if(typeof(pasteboard[conn.author])!=='undefined')
		{
			conn.emit("pasteboard.content",pasteboard[conn.author]);
		}
	}

	function _connected(conn) {
		conn.on("pasteboard.copy",function(data){
			pasteboard[conn.author]=data;
			_.each(_backend.DATA.CONNECTIONS,function(_conn,idx,_list){
				if(_conn.author==conn.author)
				{
					_conn.emit("pasteboard.content",data);
				}
			});
		});
	}
	
	function _disconnected(conn) {
		
	}


}