
module.exports = function(plug){
	/**
	 * get new instance of connection object
	 */
	this.instance = function Connection(socket) {
		this.socket=socket;
		this.author="";
		this.domain="";
		this.path="";
		this.joined=false;
		this.emit=function(event,data){
			this.socket.emit(event,data);
		}
		this.on=function(event,callback) {
			this.socket.on(event,callback);
		}
	}
}

