
var Plug = require('./plug');
var plug = new Plug({
	/**
	 * application id
	 */
	id: 'grid',
});

plug.get_router().ws().on("connection", function(socket){
	console.log("CONNECTION");
});
