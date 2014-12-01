var mongojs = require('mongojs'),
    db      = mongojs('spa_api');
module.exports = function(req, res, next) {
  db.collection('users').findOne({_id: mongojs.ObjectId(req.headers['secret-token'])}, function(err, doc) {
    if (err || !doc) {return res.send(401, {error: 'User does not exist'}); }
    req.user = doc;
    next();
  });
};
