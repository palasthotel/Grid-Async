

module.exports = function(plug){

	var _ = require("underscore");
	var uuid = require('node-uuid');
	var EventEmitter = require('events').EventEmitter;
	var self = this;

	/**
	 * vars
	 */
	var _backend = null;
	var _notification = null;
	var _events = new EventEmitter();

	/**
	 * init event tracking on plug ready
	 */
	plug.on_ready(ready);
	function ready(){
		_backend = plug.get_plugin("backend");
		_notification = plug.get_notification();
		_notification.on('connected', _connected);
		_notification.on('disconnected', _disconnected);
	}

	function _connected(conn) {
		conn.on("authors.join",function(data){
			conn.joined=true;
			// console.log("user connected! "+JSON.stringify(data));
			conn.author=data.author;
			conn.identifier=uuid.v1();
			conn.domain=data.domain;
			conn.path=data.path;
			conn.identity=data.identity;
			_backend.ensureDomainAndPath(data.domain,data.path);
			_backend.DATA.DOMAINS[conn.domain][conn.path].push(conn);
			var usersJoined=[];
			_.each(_backend.DATA.DOMAINS[conn.domain][conn.path],function(_conn,idx,_path){
				if(_conn===conn)return;
				usersJoined.push({author:_conn.author,identifier:_conn.identifier});
			});
			_backend.emit(conn,"authors.joined",{author:conn.author,identifier:conn.identifier});
			// console.log("Authorlist emitted: "+JSON.stringify(usersJoined));
			conn.emit("authors.list",usersJoined);
			_events.emit('joined',conn);
			if(conn.identity != null) {
				var count=0;
				_backend.each(conn,function(hit){
					if(hit.identity==conn.identity) {
						count++;
					}
				});
				if(count>=1) {
					conn.emit("authors.multiplehits",count+1);
				}
			}
		});
	}

	function _disconnected(conn) {
		if(conn.joined){
			_backend.emit(conn,"authors.left",conn.identifier);
			_backend.DATA.DOMAINS[conn.domain][conn.path]=_.without(_backend.DATA.DOMAINS[conn.domain][conn.path],conn);
			_backend.cleanup();
		}
	}

	/**
	 * autors events
	 */
	function _on(event, callback){
		_events.on(event,callback);
	}
	this.on_joined = function(callback){
		_on("joined", callback);
	}
	this.on_left = function(callback){
		_on("left", callback);
	}


}
