
module.exports = function(plug){

	var _=require('underscore');

	/**
	 * vars
	 */
	var _backend = null;
	var _socket = null;
	var _connection = null;

	/**
	 * init event tracking on plug ready
	 */
	plug.get_notification().on('ready', ready);
	function ready(){
		_backend = plug.get_plugin("backend");
		_socket = plug.get_router().ws();
		_connection = plug.get_plugin("connection");
		_socket.on('connection', function (socket) {
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
				plug.get_notification().emit('disconnected',conn);
				_backend.DATA.CONNECTIONS=_.without(_backend.DATA.CONNECTIONS,conn);
				console.log("Disconnected. "+_backend.DATA.CONNECTIONS.length+" Connections open.");
			});
		});
	}

}