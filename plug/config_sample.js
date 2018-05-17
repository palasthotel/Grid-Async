
/**
 * TODO: Copy to app root and name it config.js
 */

module.exports = {
	/**
	 * use this property to load custom config files
	 */
	config_files: ['config_sample.js'],
	/**
	 * application id
	 */
	id: 'plug_application',
	/**
	 * database config sample
	 */
	database: {
		type:'mysql',
		config:{
			host: '127.0.0.1',
			user: 'user',
			password: '...',
			database: 'dbname',
			connectionLimit: 20,
		},
	},
	/**
	 * router config sample
	 */
	router:{
		port: 61020,
	},
	/**
	 * message queues config sample
	 */
	message_queues:{
		type: 'redis',
		config:{
			host: '127.0.0.1',
			post: 6379,
		},
	},
	/**
	 * cache config sample
	 */
	cache:{
		type: "memcached",
		config: {
			host: 'localhost:11211',
			options: {
				lifetime: 5*60,
			}
		},
	},
};