

module.exports = function(plug){
	var EventEmitter = require('events').EventEmitter;
	var self = this;

	/**
	 * vars
	 */
	var _connection_handler = null;
	var _authors = null;
	var _events = new EventEmitter();

	/**
	 * init event tracking on plug ready
	 */
	plug.get_notification().on('ready', ready);
	function ready(){
		_connection_handler = plug.get_plugin("connection_handler");
		_authors = plug.get_plugin("authors");
		_authors.on_joined(_joined);
		plug.get_notification().on('disconnected',_disconnected);
	}

	function _disconnected(conn) {
		if(conn.PingService!=null) {
			conn.PingService.stop();
		}
		conn.PingService=null;
	}

	function _joined(conn) {
		conn.PingService=new Pinger(conn);
	}

	var Pinger = function(conn){
		var _conn = conn;
		var _countdown = null;
		var _sendtimer = null;
		function _clearTimeouts(){
			clearTimeout(_countdown);
			clearTimeout(_sendtimer);
		}

		this.stop=_clearTimeouts;
		/**
		 * send ping to client
		 */
		function _send(){
			_events.emit('send',conn);
			_conn.emit('ping.send');
			_clearTimeouts();
			_countdown = setTimeout(_lost,5000);
		}
		/**
		 * if signal was lost
		 */
		function _lost(){
			_events.emit('lost',conn);
			_clearTimeouts();
			_connection_handler.disconnect(_conn);
		}
		/**
		 * received ping from client
		 */
		function _on_received(){
			_events.emit('received',conn);
			_clearTimeouts();
			_sendtimer = setTimeout(_send,4000);
		}
		_conn.on('ping.received',_on_received);
		/**
		 * start sending pings!
		 */
		_send();

		/**
		 * ping events
		 */
		function _on(event, callback){
			_events.on(event,callback);
		}
		this.on_send = function(callback){
			_on("send", callback);
		}
		this.on_lost = function(callback){
			_on("lost", callback);
		}
		this.on_received = function(callback){
			_on("received", callback);
		}
	};


}