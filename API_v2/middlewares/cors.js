module.exports = function(req, res, next) {
  console.log('CORSHanlder called');
  console.log('request method is ', req.method);
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Allow', 'GET, HEAD, POST, DELETE');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Accept, X-Requested-With, Content-Type, SECRET-TOKEN, secret');
  res.header('Access-Control-Request-Method', 'POST,GET');
  console.log(req.headers);
  console.log("_____________________________________________");
  next();
};
