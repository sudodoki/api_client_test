module.exports = function () {
  return function(req, res, next) {
    if (!req.headers['secret-token']) {
        sendUnauthorized(res);
    }

    var db = require('../services/db');
    db.collection('users').findOne({_id: db.ObjectId(req.headers['secret-token'])}, function(err, doc) {
      if (err || !doc) {
        return sendUnauthorized(res);
      }

      req.user = doc;
      next();
    });
  };
};

function sendUnauthorized(res) {
    res.send(401, {error: 'Need to be logged in'});
}
