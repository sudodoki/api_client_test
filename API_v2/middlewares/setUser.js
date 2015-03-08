var mongojs = require('mongojs');
module.exports = function (nconfInstance) {
  var db = mongojs(nconfInstance.get('dbName'));
  return function(req, res, next) {
    db.collection('users').findOne({_id: mongojs.ObjectId(req.headers['secret-token'])}, function(err, doc) {
      if (err || !doc) {return res.send(401, {error: 'User does not exist'}); }
      req.user = doc;
      next();
    });
  };
}
