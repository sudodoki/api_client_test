var mongojs = require('mongojs'),
  db = mongojs('api_test');
require('fixtures')
  .forEach(function(doc) { return db.people.insert(doc); });
