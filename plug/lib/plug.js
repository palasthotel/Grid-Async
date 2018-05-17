"use strict";
/**
 * This is the Plug Framework by Palasthotel.
 *
 *  - Plugin handling
 *  - HTTP and WS Routing
 *  - Database handling
 *  - Memcache
 *  - Messaging Queues
 *  - Global Events
 */

/**
 * base modules
 */
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

/**
 * Events emitted by this plugin
 */
const EVENT = {
	ON_READY: {
		key: "plug_ready",
		description: "Fired when plugins are loaded"
	},
};



/**
 * init plug
 */
function Plug(config,unitTestMode){
	
	this.EVENT = function(){
		return EVENT;
	};

	if(_.isUndefined(unitTestMode)) {
		unitTestMode = false;
	}
	/**
	 * expose modules to public
	 */
	this._ = _;
	this.path = path;
	this.fs = fs;

	/**
	 * expose node modules to public
	 */
	this.root_path = path.normalize(path.dirname(require.main.filename));
	var _app_root = this.root_path;

	/**
	 * ----------------------------------------
	 * variables
	 * ----------------------------------------
	 */
	var self = this;
	var _plugins = {};

	/**
	 * get custom config if needed
	 */
	var _global_config_files = ["config.js"];
	if(!_.isUndefined(config) && !_.isUndefined(config.config_files)){
		if(_.isArray(config.config_files)){
			_global_config_files = _global_config_files.concat(config.config_files);
		}
	}
	_global_config_files = _.uniq(_global_config_files);

	/**
	 * load configs if exists
	 */
	for(var i = 0; i < _global_config_files.length; i++){
		var _global_config_file = _global_config_files[i];
		if( fs.existsSync(_app_root+"/"+_global_config_file) ){
			var _global_config = require(_app_root+"/"+_global_config_file);
			config = _.extend(_global_config,config);
		}
	}

	/**
	 * internal usage
	 */
	var _id = '';
	if(!_.isUndefined(config) && !_.isUndefined(config.id)){
		_id = config.id;
	}

	var _plugins_folder = ['plugins'];
	if(!_.isUndefined(config) && !_.isUndefined(config.plugins)){
		_plugins_folder = _plugins_folder.concat(config.plugins);
	}
	_plugins_folder = _.uniq(_plugins_folder);

	/**
	 * ----------------------------------------
	 * public methods
	 * ----------------------------------------
	 */
	 /**
	  * get Plug instance id
	  */
	this.get_id = function(){
		return _id;
	}

	/**
	 * add plugin to list and construct it
	 */
	this.add_plugin = function(slug,plugin){
		try{
			_plugins[slug]=new plugin(this);
		} catch (exception){
			console.error(exception);
			console.error(slug, plugin);
		}

	}

	/**
	 * get plugin by file or folder name
	 */
	this.get_plugin = function(slug){
		return _plugins[slug];
	}

	/**
	 * get config
	 */
   this.get_config = function(){
     return config;
   }

	/**
	 * ----------------------------------------
	 * private functions
	 * ----------------------------------------
	 */

	/**
	 * init core features if not already done
	 */
	var _core_vars = {};
	function _is_core_var_inited(var_name){
		return (_.isUndefined(_core_vars[var_name]) || _core_vars[var_name] == null );
	}
	var _init_core = {
		router: function(config){
			if(_is_core_var_inited('router')){
				var Router = require('../lib/router');
				_core_vars['router'] = new Router(config);
			}
			return _core_vars['router'];
		},
		database: function(config){
			if(_is_core_var_inited('database')){
				var Database = require('../lib/database');
				_core_vars['database'] = new Database(config);
			}
			return _core_vars['database'];
		},
		cache: function(config){
			if(_is_core_var_inited('cache')){
				var Cache = require('../lib/cache');
				_core_vars['cache'] = new Cache(config);
			}
			return _core_vars['cache'];
		},
		message_queues: function(config){
			if(_is_core_var_inited('message_queues')){
				var MessageQueues = require('../lib/message_queues');
				_core_vars['message_queues'] = new MessageQueues(config);
			}
			return _core_vars['message_queues'];
		},
		notification: function(){
			if(_is_core_var_inited('notification')){
				var EventEmitter = require('events').EventEmitter;
				_core_vars['notification'] = new EventEmitter();
				_core_vars['notification'].setMaxListeners(0);
			}
			return _core_vars['notification'];
		}
	}
	
	/**
	 * empty core getters for autocompletion
	 */
	this.get_router = function(){};
	this.get_database = function(){};
	this.get_cache = function(){};
	this.get_message_queues = function(){};
	this.get_notification = function(){};
	
	/**
	 * core module public getters
	 */
	for(let feature in _init_core){
		this["get_"+feature] = _init_core[feature];
	}

	/**
	 * init core features if config comes with constructor
	 */
	if(!_.isUndefined(config)){
		for(var feature in _init_core){
			if(!_.isUndefined(config[feature])){
				_init_core[feature](config[feature]);
			}
		}
	}
	
	/**
	 * simple adding event listeners
	 */
	this.on = function(event, callback){
		this.get_notification().on(event, callback);
	}
	this.off = function(event, callback){
		this.get_notification().off(event, callback);
	}
	
	/**
	 * on ready
	 */
	this.on_ready = function(callback){
		this.on(EVENT.ON_READY.key, callback);
	};
	
	this.off_ready = function(callback){
		this.off(EVENT.ON_READY.key, callback);
	};
	
	/**
	 * ----------------------------------------
	 * init Plug
	 * do not add any functions after this part
	 * ----------------------------------------
	 */
	function _process_plugin_folder(plugins_path){
		if(fs.existsSync(plugins_path)){
			_.each(fs.readdirSync(plugins_path),function(file){
				var matches = file.match(/^(.*)\.js$/i);
				if(matches){
					self.add_plugin( matches[1], require(plugins_path+"/"+matches[1]) );
				} else if( fs.lstatSync(plugins_path+"/"+file).isDirectory()
					&& fs.existsSync(plugins_path+"/"+file+"/index.js") ){
					self.add_plugin( file, require(plugins_path+"/"+file) );
				}
			});
		}
	}
	if(!unitTestMode) {
		for(var i = 0; i < _plugins_folder.length; i++){
			_process_plugin_folder(_app_root+"/"+_plugins_folder[i]);
		}
		this.get_notification().emit(EVENT.ON_READY.key, this);
	}
}


/**
 * Plug to public!
 */
module.exports = Plug;