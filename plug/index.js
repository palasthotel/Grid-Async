/*!
 * Plug
 * Author Edward Bock
 * Author Enno Welbers
 * Author Julia Krischik
 * Copyright(c) 2015 Palasthotel
 * http://www.gnu.org/licenses/gpl-2.0.html GPLv2
 */

'use strict';

var process=require('process');
var _=require('underscore');

var unitTesting=false;
_.each(process.argv,function(item,index,list){
    if(item=="--tests") {
        unitTesting=true;
    }
});

if(unitTesting) {
    module.exports = require('./lib/plug_unittesting.js');
}
else {
    module.exports = require('./lib/plug');
}

