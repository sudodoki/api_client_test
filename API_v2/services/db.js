var nconfInstance = require('../nconf-wrapper');
var mongojs = require('mongojs');

var db = mongojs(nconfInstance.get('dbName'));

module.exports = db;
