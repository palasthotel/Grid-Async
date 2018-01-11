
module.exports = function(plug){

	var _=require('underscore');

	/**
	 * vars
	 */
	var _backend = null;
	var _socket = null;
	var _connection = null;
	var self = this;

	/**
	 * init event tracking on plug ready
	 */
	plug.on_ready(ready);
	function ready(){
		_backend = plug.get_plugin("backend");
		_socket = plug.get_router().ws();
		_connection = plug.get_plugin("connection");
		_socket.on('connection', _ws_connection );
	}

	/**
	 * websocket events
	 */
	function _ws_connection(socket){
		var conn= new _connection.instance(socket);
			_backend.DATA.CONNECTIONS.push(conn);
			console.log("Connected. "+_backend.DATA.CONNECTIONS.length+" Connections open.");
			plug.get_notification().emit('connected',conn);
			/**
			* connection lost to user
			*
			*/
			socket.on('disconnect', function (reason) {
				console.log("Disconnected.");
				self.disconnect(conn);
			});
	}

	/**
	 * disconnect connection
	 */
	this.disconnect = function disconnect(conn){
		plug.get_notification().emit('disconnected',conn);
		_backend.DATA.CONNECTIONS=_.without(_backend.DATA.CONNECTIONS,conn);
		console.log("Disconnected. "+_backend.DATA.CONNECTIONS.length+" Connections open.");
	}

}
