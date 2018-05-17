
const _ = require("underscore");
const EventEmitter = require('events').EventEmitter;

const EVENT = {
	ON_DONE: {
		key: "done",
		description: "Query is done",
	},
};

class DatabaseQuery{
	
	/**
	 *
	 * @param query_string
	 * @param options
	 */
	constructor(query_string, options){
		
		this._notification = new EventEmitter();
		this._notification.setMaxListeners(0);
		
		this.query = "";
		
		/**
		 * save to local variables
		 */
		this._options = {
			error: false,
			values: {},
		};
		
		/**
		 * if options is a callbackfunction or an options object
		 */
		if(typeof options === typeof {}){
			this._options = _.extend({},this._options,options);
		}
		
		/**
		 * replace query placeholders
		 * @param  {object} _options.replace assoc array placeholder values
		 */
		if(!_.isUndefined(this._options.replace)){
			this.query = this._replacements_for_query(query_string, this._options.replace);
		} else {
			this.query = query_string;
		}
		
	}
	
	/**
	 * prepare query
	 */
	_replacements_for_query(query, replacements_assoc){
		for(let replace in replacements_assoc){
			if(!replacements_assoc.hasOwnProperty(replace)) continue;
			const regex = new RegExp('{{'+replace+'}}','g');
			query = query.replace(regex, replacements_assoc[replace]);
		}
		return query;
	}

	/**
	 * execute the query
	 * @param connection Mysql connection
	 * @return {Query}
	 */
	execute(connection){
		const query = connection.query(this.query, this._options.values, (_err, result)=>{
			let success = true;
			connection.release();
			if(_err){
				console.error(_err);
				console.error(result);
				console.log(query.sql);
				console.error("Error with Query: "+this.query);
				success = false;
			}
			this._emit_done({success:success,query: this.query,options: this._options,result:result, sql: query.sql});
		});
		return query;
	}

	

	/**
	 * --------------------------------
	 * event listener methods
	 * all available event methods
	 * --------------------------------
	 */
	on_done(callback){
		this._notification.on(EVENT.ON_DONE.key,callback);
	}
	_emit_done(result){
		this._notification.emit(EVENT.ON_DONE.key, result);
	}
}

module.exports = DatabaseQuery;