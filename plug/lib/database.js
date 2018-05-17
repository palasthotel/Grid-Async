"use strict";

const _ = require("underscore");
const DatabaseQuery = require("./database_query");
const EventEmitter = require('events').EventEmitter;

const EVENT = {
	ON_ERROR: {
		key: "on_db_error",
		description: "On database error",
	},
	ON_QUERY_DONE: {
		key: "query_done",
		description: "A query is done",
	},
	ON_BUILD_TABLES_FINISH:{
		key: "build_tables_finish",
		description: "After tables created.",
	}
};

function Database(config){
	/**
	 * ----------------------------------------
	 * variables
	 * ----------------------------------------
	 */
	const self = this;
	const _notification = new EventEmitter();
	let _pool = null;
	
	/**
	 * ----------------------------------------
	 * public methods
	 * ----------------------------------------
	 */
	/**
	 * returns query object
	 */
	this.prepare_query = function(query_string, options){
		return new DatabaseQuery(query_string,options);
	}

	/**
	 * execute query and run callback function
	 * @param {DatabaseQuery} prepared_query
	 */
	this.query = function(prepared_query){
		/**
		 * try to get a connection
		 */
		_pool.getConnection(function(err, connection){
			if(!err){
				prepared_query.on_done(function(data){
					self.emit_query_done({success:data.success,query:data.query});
				});
				prepared_query.execute(connection);
			} else {
				console.error(err);
				self.emit_query_done({success:false,msg:'connection error',query:prepared_query.query});
				connection.release();
			}
		});
	};


	/**
   * init transaction
   * @param {function} callback
   */
  this.transaction = function(callback){
    _pool.getConnection(function(err, connection){
	    if(!err){
		    connection.beginTransaction(function(err) {
			    callback(err, connection);
		    });
	    } else {
		    callback(err, connection);
	    }
    });
  }

	/**
	 * escape string
	 */
	this.escape = function(value){
		return _pool.escape(value);
	}
	
	/**
	 * get type of database
	 */
	this.get_type = function(){
		return config.type;
	}

	/**
	 * table builder for schema object
	 */
	this.build_tables = function(schema, params, callback){

		/**
		 * if there is a callback for build tables
		 */
		this.on_build_tables_finish(callback);

		/**
		 * build query from schema
		 */
		for( let tablename in schema ) {
			if(!schema.hasOwnProperty(tablename)) continue;
			const data = schema[tablename];
			let query = 'create table if not exists '+tablename+' (';
			let first = true;
			for( let fieldname in data.fields ) {
				if(!data.fields.hasOwnProperty(fieldname)) continue;
				const fielddata = data.fields[fieldname];
				if ( ! first ) {
					query += ',';
				} else {
					first = false;
				}
				query += fieldname+' ';
				switch(fielddata.type){
					case 'int':
					case 'bigint':
						if(typeof fielddata.length != typeof undefined){
  						    query += fielddata.type+'('+fielddata.length+') '
						} else {
						  query += fielddata.type+' ';
						}
						break;
					case 'text':
						query += 'text ';
						break;
					case 'serial':
						query += 'int ';
						break;
          			case 'timestamp':
						query += 'timestamp ';
						break;
					case 'varchar':
  						if(!_.isUndefined(fielddata.length) ){
  							query += 'varchar('+fielddata.length+') '
						} else {
						  query += 'varchar(255)';
						}
						break;
					default:
						console.error("Unknown field type: "+fielddata.type);
				}
				if ( !_.isUndefined(fielddata.unsigned) && fielddata.unsigned === true ) {
					query += ' unsigned';
				}
				if ( !_.isUndefined(fielddata['not null']) && fielddata['not null'] == true ) {
					query += ' not null';
				}
				if ( !_.isUndefined(fielddata['null']) && fielddata['null'] == true ) {
					query += ' null';
				}
				if ( !_.isUndefined(fielddata['auto_increment']) && fielddata['auto_increment'] == true ) {
					query += ' auto_increment';
				}
				if ( !_.isUndefined(fielddata['default']) ) {
					query += ' default '+fielddata['default'];
				}
				if ( !_.isUndefined(fielddata['comment']) ) {
					query += ' comment "'+fielddata['comment']+'"';
				}
				//TODO needed?
				if ( fielddata.type == 'serial' ) {
					query += ' auto_increment';
				}
			}
			/**
  		 * Keys
  		 */
			//primary key
			if ( !_.isUndefined( data['primary key'] )) {
  			for(let i = 0; i < data['primary key'].length; i++){
				query += ',constraint primary key ';
  				if(!_.isUndefined( data['primary key'][i].key )){
    				query += data['primary key'][i].key+' ';
          }
          query += '('+data['primary key'][i].value+')';
        }
			}
			//unique key
			if ( !_.isUndefined( data['unique key'] )) {
  			for(let i = 0; i < data['unique key'].length; i++){
				query += ',constraint unique key ';
  				if(!_.isUndefined( data['unique key'][i].key )){
    				query += data['unique key'][i].key+' ';
          }
          query += '('+data['unique key'][i].value+')';
        }
			}
			//key
			if ( !_.isUndefined( data['key'] )) {
  			for(let i = 0; i < data['key'].length; i++){
				query += ',key ';
  				if(!_.isUndefined( data['key'][i].key )){
    				query += data['key'][i].key+' ';
          }
          query += '('+data['key'][i].value+')';
        }
			}
			//foreign key
			if ( !_.isUndefined( data['foreign key value'] )) {
				query += ',constraint foreign key ';
				if(!_.isUndefined( data['foreign key key'] )){
  				query += data['foreign key key'].join(',')+' ';
        }
        query += '('+data['foreign key value'].join(',')+')';
			}
			//references
			if ( !_.isUndefined( data['references value'] )) {
				query += ',constraint references ';
				if(!_.isUndefined( data['references key'] )){
  				query += data['references key'].join(',')+' ';
        }
        query += '('+data['references value'].join(',')+')';
			}
			/**
  		 * Contraints
  		 */
			if ( !_.isUndefined( data['contraints'] )) {
  			for(let i = 0; i < data['contraints'].length; i++){
				  query += ',constraint ';
  				if(!_.isUndefined( data['contraints'][i].name )){
    				query += data['contraints'][i].name + ' ';
          }
          query += data['contraints'][i].constraint+' ';
          if(!_.isUndefined( data['contraints'][i]['on delete'] )){
    				query += 'on delete ' + data['contraints'][i]['on delete'] + ' ';
          }
          if(!_.isUndefined( data['contraints'][i]['on update'] )){
    				query += 'on update ' + data['contraints'][i]['on update'] + ' ';
          }
        }
			}
			query += ') ';

			if ( !_.isUndefined( data['mysql_engine'] ) ) {
				query += 'ENGINE = '+data['mysql_engine'];
			}
			//charset
			if ( !_.isUndefined( data['charset'] ) ) {
				query += ' default charset = '+data['charset'];
			}

			/**
			 * execute the query
			 */
			const the_query = self.prepare_query(query, {replace: params});
			the_query.on_done(function(result){
				self.notification().emit(EVENT.ON_BUILD_TABLES_FINISH.key, {
					success:result.success,
					schema:schema
				});
			});

			self.query(the_query);

		}
	}

	this.format = (sql, inserations)=>{
		return require('mysql').format(sql, inserations);
	};


	/**
	 * database EVENT
	 */
	this.notification = function(){
		return _notification;
	}

	/**
	 * --------------------------------
	 * event listener methods
	 * all available event methods
	 * --------------------------------
	 */

	/**
	 * build tables has finished event registration for once
	 */
	this.on_build_tables_finish = function(callback){
		this.notification().once(EVENT.ON_BUILD_TABLES_FINISH.key, callback);
	}

	/**
	 * on query has executed
	 */
	this.on_query_done = function(callback){
		this.notification().on(EVENT.ON_QUERY_DONE.key, callback);
	}
	this.emit_query_done = function(result){
		self.notification().emit(EVENT.ON_QUERY_DONE.key, result);
	}

	/**
	 * ----------------------------------------
	 * private functions
	 * ----------------------------------------
	 */
	const init_db = {
		mysql: function(config){
			var mysql = require("mysql");
			_pool = mysql.createPool(_.extend({
				host: 'localhost',
				user: 'root',
				password: '',
				database: '',
				connectionLimit: 10,
				waitForConnections: true,
				queueLimit: 0,
				typeCase: true,
			},config));
		}
	}

	/**
	 * ----------------------------------------
	 * init Database
	 * ----------------------------------------
	 */
	if( !_.isUndefined(config) && !_.isUndefined(config.type) && !_.isUndefined(init_db[config.type]) ){
		init_db[config.type](config.config);
		_pool.on('error',function(err){
			console.error(err);
		});
	}

	this.DatabaseQuery = function(){
  	    return DatabaseQuery;
	}

}

module.exports = Database;