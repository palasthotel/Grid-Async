var _=require('underscore');

module.exports.DATA={
	CONNECTIONS:[],
	DOMAINS:{}
}

module.exports.ensureDomainAndPath=function(domain,path) {
		if(typeof(module.exports.DATA.DOMAINS[domain])=='undefined')
		{
			module.exports.DATA.DOMAINS[domain]={};
		}
		if(typeof(module.exports.DATA.DOMAINS[domain][path])=='undefined')
		{
			module.exports.DATA.DOMAINS[domain][path]=[];
		}
}

module.exports.cleanup=function() {
	var domains=_.keys(module.exports.DATA.DOMAINS);
	_.each(domains,function(domain,idx,list){
		var paths=_.keys(module.exports.DATA.DOMAINS[domain]);
		_.each(paths,function(path,_idx,_list){
			if(module.exports.DATA.DOMAINS[domain][path]==[])
			{
				delete module.exports.DATA.DOMAINS[domain][path];
			}
		});
		if(module.exports.DATA.DOMAINS[domain]=={})
		{
			delete module.exports.DATA.DOMAINS[domain];
		}
	});
}

module.exports.emit=function(from,event,data) {
	if(!from.joined)return;
	_.each(module.exports.DATA.DOMAINS[from.domain][from.path],function(_conn,_idx,_list){
		if(_conn===from)return;
		_conn.emit(event,data);
	});
}