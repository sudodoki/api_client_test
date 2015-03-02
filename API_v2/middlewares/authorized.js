module.exports = function (_) {
  return function(req, res, next) {
    if (!req.headers['secret-token']) { res.send(401, {error: 'Need to be logged in'}); }
    next();
  };
}
