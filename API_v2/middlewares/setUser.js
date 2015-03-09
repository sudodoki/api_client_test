module.exports = function () {
  return function(req, res, next) {
    next();

    // TODO: at the current stage we token = userId, so we do not need to search for user second time
    return;
    var db = require('../services/db');
    db.collection('users').findOne({_id: db.ObjectId(req.headers['secret-token'])}, function(err, doc) {
      if (err || !doc) {return res.send(401, {error: 'User does not exist'}); }
      req.user = doc;
      next();
    });
  };
};
