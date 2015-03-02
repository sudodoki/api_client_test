module.exports = function (_) {
  return function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Allow', 'GET, HEAD, POST, DELETE');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Headers', 'Accept, X-Requested-With, Content-Type, SECRET-TOKEN, secret');
    res.header('Access-Control-Request-Method', 'POST,GET');
    next();
  };
}
