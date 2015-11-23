

module.exports = function(plug){

	var _=require('underscore');
	
	/**
	 * variables
	 */
	var DATA={
		CONNECTIONS:[],
		DOMAINS:{}
	};
	this.DATA = DATA;

	this.ensureDomainAndPath=function(domain,path) {
		if(typeof(DATA.DOMAINS[domain])=='undefined')
		{
			DATA.DOMAINS[domain]={};
		}
		if(typeof(DATA.DOMAINS[domain][path])=='undefined')
		{
			DATA.DOMAINS[domain][path]=[];
		}
	}

	this.cleanup=function() {
		var domains=_.keys(DATA.DOMAINS);
		_.each(domains,function(domain,idx,list){
			var paths=_.keys(DATA.DOMAINS[domain]);
			_.each(paths,function(path,_idx,_list){
				if(DATA.DOMAINS[domain][path]==[])
				{
					delete DATA.DOMAINS[domain][path];
				}
			});
			if(DATA.DOMAINS[domain]=={})
			{
				delete DATA.DOMAINS[domain];
			}
		});
	}

	this.emit=function(from,event,data) {
		module.exports.each(from,function(_conn) {
			_conn.emit(event,data);
		});
	}

	this.each=function(from,callback) {
		if(!from.joined)return;
		_.each(DATA.DOMAINS[from.domain][from.path],function(_conn,_idx,_list){
			if(_conn===from)return;
			callback(_conn);
		});
	}

}