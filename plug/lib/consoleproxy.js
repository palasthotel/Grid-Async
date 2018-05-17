module.exports=ConsoleProxy;

function ConsoleProxy() {
	var outputFunction=console.log;
	var self=this;
	console.log=function() {
		self.listener.apply(self,arguments);
	}

	this.log = function() {
		outputFunction.apply(console, arguments);
	}

	this.listener=function() {

	};
}