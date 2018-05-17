"use strict";

var _ = require("underscore");
var EventEmitter = require('events').EventEmitter;

const EVENT = {
	ON_SET: {
		key: "on_cache_set",
		description: "A cache was set",
	},
	ON_GET:{
		key: "on_cache_get",
		description: "A cache was loaded from memory",
	}
};

module.exports = Cache;

function Cache(config){
	var self = this;
	var _cache = null;
	var _lifetime = 60*5;
	var _connected = false;
	var _notification = null;
	
	/**
	 * get cached value
	 * @param  {string}   key      unique key
	 * @param  {Function} callback function with: error, result
	 */
	this.get = function(key, callback){
		
		if(!_connected){
			callback(true, null);
			self.emit_get({ key:key, value:null, success:false });
			return;
		}
		_cache.get(key,callback);
		// _cache.get(key, function(err, result){
		// 	var success = true;
		// 	if(err){
		// 		success = false;
		// 		console.error(err);
		// 	}
		// 	self.notification().emit('get',{key:key,result:result,success:success});
		// });
	}
	this.set = function(key, value, lifetime){
		if(!_connected){
			self.emit_set({ key:key, value:value, success:false, lifetime:lifetime });
			return;
		}
		var _lt = _lifetime;
		if(!_.isUndefined(lifetime)){
			_lt = lifetime;
		}
		_cache.set(key, value, _lt, function(err, result){
			var success = true;
			if(err){
				success = false;
				console.error(err);
			}
			self.emit_set({ key:key, value:value, success:success, lifetime:lifetime});
		});
	}
	
	/**
	 * delete memcached value
	 * @param key
	 * @param cb
	 */
	this.delete = function(key, cb = ()=>{}){
		_cache.del(key, cb);
	}

	var init_cache = {
		memcached: function(config){
			if(_cache == null){
				var Memcached = require('memcached');
				var _options = _.extend({
					timeout: 2000,
				},config.options);

				if(!_.isUndefined(_options.lifetime)){
					_lifetime = _options.lifetime;
				}

				_cache = new Memcached(config.host,_options);
				_connected = true;
				_cache.on('issue',function(){ console.log("issue memcached"); _connected = false; });
				_cache.on('failure',function(){ console.log("failure memcached"); _connected = false; });
				_cache.on('reconnected',function(){ console.log("reconnected memcached"); _connected = true; });
				
			}
		}
	};

	/**
	 * database EVENT
	 */
	this.notification = function(){
		if(_notification == null){
			_notification = new EventEmitter();
		}
		return _notification;
	}
	
	// -----------------
	// Events
	// -----------------
	this.on_set = function(callback){
		self.notification().on(EVENT.ON_SET.key,callback);
	}
	this.emit_set = function(data){
		self.notification().emit(EVENT.ON_SET.key,data);
	}
	this.on_get = function(callback){
		self.notification().on(EVENT.ON_GET.key,callback);
	}
	this.emit_get = function(data){
		self.notification().emit(EVENT.ON_GET.key,data);
	}
	
	
	/**
	 * ----------------------------------------
	 * init Cache
	 * ----------------------------------------
	 */
	if( !_.isUndefined(config) && !_.isUndefined(config.type) && !_.isUndefined(init_cache[config.type]) ){
		init_cache[config.type](config.config);
	}
}