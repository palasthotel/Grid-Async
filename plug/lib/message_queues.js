"use strict";

const _ = require("underscore");
const Queue = require("bull");
const EventEmitter = require('events').EventEmitter;

module.exports = Message_Queues;

function Message_Queues(config){
	/**
	 * ----------------------------------------
	 * variables
	 * ----------------------------------------
	 */
	const self = this;
	let _config = {
		port: 6379,
		host: '127.0.0.1',
		clean_time: 5000,
	};
	const _queues = {};
	const _notification = new EventEmitter();

	/**
	 * ----------------------------------------
	 * public methods
	 * ----------------------------------------
	 */

	/**
	 * all EVENT for this core feature
	 */
	this.on = {
		/**
		 * on new Message event from queue
		 * @param  {string}   queue
		 * @param  {Function} callback
		*/
		message: function(queue, callback){
			_notification.on(_build_queue_event('message',queue), callback);
		},
		/**
		 * on new insert to queue
		 * @param  {string}   queue
		 * @param  {Function} callback
		 */
		insert: function(queue, callback){
			_notification.on(_build_queue_event('insert',queue), callback);
		}
	};
	
	/**
	 * save value to queue
	 * @param {string} queue
	 * @param {any} value
	 */
	this.save = function(queue, value){
		const _queue = this.get_queue(queue);
		_queue.add(value);
		_notification.emit(_build_queue_event('insert',queue), value);
	}

	/**
	 * event function for new message
	 * @param  {string}   queue
	 * @param  {Function} callback
	 */
	this.listen_to = function(queue, callback){
		this.on.message(queue, callback);
	}
	
	/**
	 * process messages from queue
	 * @param {string} queue_name
	 * @param {function} callback
	 * @param {function} error_fn
	 */
	this.process = function(queue_name, callback, error_fn){
  	    const _queue = this.get_queue(queue_name);
		_queue.process(function(job, done){
			_notification.emit(_build_queue_event('message', queue_name), job.data);
			if(!callback(job.data, done, job)){
				done();
			}
		});
		_queue.on('error',(error)=>{
			if(_.isUndefined(error_fn)){
				console.error(error);
			} else {
				error_fn(error);
			}
		});
	}
	
	/**
	 * get existing queue or create new one and get it
	 * @param  {string} queue [description]
	 */
	this.get_queue = function(queue){
		if(_.isUndefined(_queues[queue]) || _queues[queue] == null ){
			_queues[queue] = new Queue(queue, _config.port, _config.host);
			_queues[queue].on('failed',on_failed);
		}
		return _queues[queue];
	}

	this.clean_queue = function(queue, milliseconds){
	    if(typeof milliseconds == typeof undefined){
	        milliseconds = _config.clean_time;
	    }
	    this.get_queue(queue).clean(milliseconds);
	}

	/**
	 * default error handler
	 */
	function on_failed(job, err){
		console.error(job);
		console.error(err);
	}

	/**
	 * ----------------------------------------
	 * private functions
	 * ----------------------------------------
	 */

	/**
	 * build event with queue
	 * @param {string} ev event name
	 * @param {string} queue name of queue
	 * @return {string}
	 */
	function _build_queue_event(ev, queue){
		return ev+"_"+queue;
	}

	/**
	 * init plugin
	 */
	const init = {
		redis: function(config){
			_config = _.extend(_config,config);
		}
	}
	if( !_.isUndefined(config) && !_.isUndefined(config.type) && !_.isUndefined(init[config.type]) ){
		init[config.type](config.config);
	} else {
		throw new new Error("No Message Queue implementation for "+config.type);
	}

}