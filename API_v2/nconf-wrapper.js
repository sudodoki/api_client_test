var nconf = require('nconf');
var env = process.env.NODE_ENV || 'development';
nconf
  .argv()
  .env()
  .file('./config/' + env +'.json')
  .defaults({
    loglevel: 'info',
    appName: 'spa-api',
    dbName : 'spa_api',
    port   : 3000,
    host   : 'localhost'
  });

module.exports = nconf;
