module.exports=function Connection(socket) {
	this.socket=socket;
	this.author="";
	this.domain="";
	this.path="";
	this.joined=false;
	this.emit=function(event,data){
		this.socket.emit(event,data);
	}
}
