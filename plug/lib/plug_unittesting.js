var _=require('underscore');
var fs=require('fs');
var path=require('path');
var proxy=require('./consoleproxy');
module.exports=UnitTesting;

function checkWhiteList(whitelist,suite) {
    if(whitelist==null || whitelist==undefined || whitelist.length==0) {
        return true;
    }
    var allowed=false;
    _.each(whitelist,function(allowedsuite){
        if(allowedsuite==suite.substring(6)) {
            allowed=true;
        } else if(allowedsuite[allowedsuite.length-1]=="/" && suite.substring(6,6+allowedsuite.length)==allowedsuite) {
            //substring ab 6 um "tests/" loszuwerden beim Vergleich
            allowed=true;
        }
    });
    return allowed;
}

function findTestSuitesIn(path,whitelist) {
    var tests=[];
    _.each(fs.readdirSync(path),function(file) {
        var matches = file.match(/^(.*)\.js$/i);
        if(matches && checkWhiteList(whitelist,path+"/"+matches[1])) {
            tests.push(path+"/"+matches[1]);
        } else {
            if(fs.statSync(path+"/"+file).isDirectory()) {
                var subtests=findTestSuitesIn(path+"/"+file,whitelist);
                _.each(subtests,function(elem){
                    tests.push(elem);
                });
            }
        }
    });
    return tests;
}

function findTestSuites(whitelist) {
    var result=findTestSuitesIn('tests',whitelist,false);
    return _.map(result,function(elem) {
        return elem.substring(6);//remove "tests/" prefix from recursion.
    })
}

function UnitTesting(config) {
    realconsole=new proxy();
    realconsole.log("PLUG Unit Testing Laboratory");
    var help=false;
    var showAllOutput=false;
    var onlySuite=null;
    var onlyFunction=null;
    _.each(process.argv,function(item,index,list) {
        if(item=="--help") {
            help=true;
        }
        if(item=="--showAllOutput") {
            showAllOutput=true;
        }
        if(item.substring(0,6)=="--only") {
            var definition=item.substring(7);
            var definitions=definition.split(".");
            onlySuite=definitions[0];
            onlyFunction=definitions[1];
        }
    });
    if(help) {
        realconsole.log("available parameters:");
        realconsole.log("--tests - performs a unit testing run");
        realconsole.log("--help - shows this help screen");
        realconsole.log("--showAllOutput - disables the logging buffer and shows everything directly");
        realconsole.log("--only=SUITE - only runs a certain test suite");
        realconsole.log("--only=SUITE.FUNCTION - only runs a certain test");
        return;
    }
    if(onlySuite==null) {onlySuite=[]}
    else { onlySuite=[onlySuite];}
    var tests=findTestSuites(onlySuite);

    realconsole.log("Unit Test Suites found: ");
    _.each(tests,function(file) {
        realconsole.log("* "+file);
    });

    var queue=[];

    _.each(tests,function(file) {
        var appRoot=path.normalize(path.dirname(require.main.filename));
        var template=new PlugTemplate();
        var test=require(appRoot+'/tests/'+file);
        var test_functions=[];
        _.each(test,function(thing,key,object){
            if( _.isObject(object) && _.isString(key)){
                var matches=key.match(/test.*/i);
                if(matches) {
                    if(onlyFunction == null || onlyFunction==undefined || onlyFunction==key)
                        test_functions.push(key);
                }
            }
        });
        _.each(test_functions,function(test_function) {
            queue.push({
                key:file,
                container:test,
                function:test_function
            });
        });
    });
    realconsole.log(queue.length+" Tests queued for execution");
    var succeeded=0;
    var failed=0;

    var performTest=function(test,callback) {
        var container=test.container;
        var plugin_template=new PlugTemplate();
        debugger;
        if(!_.isUndefined(container.setup)) {
	        /**
	         * if setup returns true we wait for the done function to be called
	         */
            var ret = container.setup(plugin_template, function(){
	            executeTest(container, plugin_template, test, callback);
            });
	        if(ret) return;
        }
	    executeTest(container, plugin_template, test, callback);

    }
	var executeTest=function(container, plugin_template, test, callback){
		var plug=plugin_template.buildPlug();
        var buffer=[];
        realconsole.listener=function() {
            if(showAllOutput) {
                realconsole.log.apply(realconsole,arguments);
            } else {
                buffer.push(arguments);
            }
        }
		container[test.function](plug,function(result){
			if(result) {
				realconsole.log("* "+test.key+"::"+test.function+" SUCCEEDED");
			} else {
				realconsole.log("* "+test.key+"::"+test.function+" FAILED");
                if(!showAllOutput) {
                    realconsole.log("--------------- LOG OF FAILED TEST ---------------");
                        _.each(buffer,function(elem){
                            realconsole.log.apply(realconsole,elem);
                        });
                        realconsole.log("------------- END OF FAILED TEST LOG -------------");
                }
			}
			if(!_.isUndefined(container.teardown)) {
				/**
				 * plug and done function for teardown
				 * if teardown returns true we wait for the done function to be called
				 */
				var ret = container.teardown(plug, function(){
					callback(result);
				});
				if(ret) return;
				callback(result);
			} else {
                callback(result);
            }
		});
	}

    var dequeue=function() {
        if(queue.length==0)return null;
        var test = _.first(queue);
        queue = _.without(queue, test);
        return test;
    }

    var runTests=function() {
        var test=dequeue();
        if(test!=null) {
            performTest(test,function(result){
                if(result) {
                    succeeded++;
                } else {
                    failed++;
                }
                runTests();
            })
        } else {
            realconsole.log("Done!");
            realconsole.log(succeeded+" Tests succeeded");
            realconsole.log(failed+" Tests failed");
        }
    };
    runTests();

}

function PlugTemplate() {
    this._config={};
    this._plugins={};
    this.setConfig=function(config) {
        this._config = config;
    };
    this.addPlugin=function(slug,pathtofile) {
        this._plugins[slug]=pathtofile;
    };

    this.buildPlug=function() {
        var appRoot=path.normalize(path.dirname(require.main.filename));
        var plug=require('./plug.js');
        var instance=new plug(this._config,true);
        _.each(this._plugins,function(elem,key,obj) {
            instance.add_plugin(key,require(appRoot+"/"+elem));
        });
        instance.get_notification().emit('ready');
        return instance;
    }
}