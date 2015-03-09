var restify = require('restify'),
    fs      = require('fs'),
    path    = require('path'),
    pkg     = require('./package.json'),
    nconfInstance = require('./nconf-wrapper');



var appName = nconfInstance.get('appName');
var Logger = require('bunyan');
var log = new Logger.createLogger({
  name: appName,
  serializers: {
      req: Logger.stdSerializers.req
  }
});
log.level(nconfInstance.get('loglevel'));

var db = require('./services/db');

var server = restify.createServer({
  name: appName,
  log: log
});

var CORSHandler = require('./middlewares').CORSHanlder;
var passport = require('./middlewares').passport;

var stripOut = function (user) {
  var copy;
  try {
    copy = JSON.parse(JSON.stringify(user));
  } catch(e) {
    copy = {};
  }

  if (copy.avatar && copy.avatar.indexOf('/') === 0) {
    copy.avatar = server.url + copy.avatar;
  }

  delete copy.password;
  delete copy.is_published;
  delete copy.token;
  return copy;
};

server
  .use(CORSHandler)
  .use(passport.initialize())
  .use(restify.fullResponse())
  .pre(restify.pre.sanitizePath())
  .use(restify.bodyParser({keepExtensions: true}));

var forAuthorized = passport.authenticate('token', {session: false});

server.get(/\/avatars\/?.*/, restify.serveStatic({
  directory: './public'
}));

server.on('NotFound', function(req, res, cb) {
  CORSHandler(req, res, function(){
    return res.send(404, {status: 'Not Found'});
  });
});

server.on('MethodNotAllowed', function(req, res, cb){
  CORSHandler(req, res, function(){
    return res.send(204);
  });
});

server.pre(function (req, response, next) {
    req.log.debug({ req: req }, 'REQUEST');
    next();
});

server.listen(nconfInstance.get('port'), nconfInstance.get('host'), function() {
  log.info('%s is up and running. Check out %s.', server.name, server.url);
});

server.get('/version', function(req, res, next) {
  return res.send(pkg.version);
});

server.post('/signin', function (req, res, next) {
  var user = req.params;

  if (!user.login && !user.password) {
    return res.send(422, {error: 'Please specify both login & password'});
  }

  next();
}, passport.authenticate('local', {session: false}), function(req, res) {
  req.log.info({user: req.user}, 'SIGNIN');
  res.send(200, {status: 'good to go', token: req.user.token});
});

server.post('/signup', function (req, res, next) {
  var errors = [],
      user = req.params;
  if (!user.login) {
    errors.push({login: 'Login shouldn\'t be empty'});
  }
  if (!user.password) {
    errors.push({password: 'Use at least some password'});
  }
  if (!(user.password && user.passwordConfirmation && user.password === user.passwordConfirmation)) {
    errors.push({passwordConfirmation: 'Should match password'});
  }
  db.collection('users').find({login: user.login}, function (err, userDoc) {
    if (err) { return handleDbError(err, res); }
    if (userDoc.length > 0) {
      errors.push({login: 'This login is already taken, sorry'});
    }
    if (errors.length === 0) {
      db.collection('users').insert({
        login: user.login,
        password: user.password,
        avatar: 'http://retroavatar.appspot.com/api?name='+user.login,
        is_published: false,
        email: user.email
      }, function (err, userDoc) {
        if (err) { return handleDbError(err, res); }
        req.log.info({userDoc: userDoc}, 'SIGNUP');
        res.send(200, { status: 'New and shiny account for you!', token: userDoc._id});
      });
    } else {
      res.send(422, {errors: errors});
    }
  });
});

server.get('/user', function (req, res, next) {
  db.collection('users').find({is_published: true}, function (err, docs) {
    if (err) { return handleDbError(err, res); }
    res.send(docs.map(stripOut));
  });
});

server.get('/user/me', forAuthorized, function (req, res, next) {
  return res.send(200, req.user);
});

server.get('/user/:id', forAuthorized, function (req, res, next) {
  var id = req.params.id;

  db.collection('users').findOne({ _id: db.ObjectId(id), is_published: true}, function(err, doc) {
    if (err) { return handleDbError(err, res); }
    if (!doc) {return res.send(404, {error: 'User does not exist'}); }
    return res.send(200, stripOut(doc));
  });
});

server.post('/user/me', forAuthorized, function (req, res, next) {
  var userUpdate = { $set: req.params };
  db.collection('users').findAndModify({
    query: { _id: req.user._id},
    update: userUpdate,
    'new': true,
  }, function(err, doc, lastErrorObject) {
    if (err) { return handleDbError(err, res); }
    req.log.info({doc: doc}, 'USER_ME_UPDATE');
    res.send(200, stripOut(doc));
  });
});

server.post('/user/me/avatar', forAuthorized, function(req, res, next) {
  if (!req.files || !req.files.avatar) {
    return res.send(422, {errors: [{avatar: 'No file was uploaded'}]});
  }
  req.log.info({path: req.files.avatar.path}, 'AVA_UPDATE_START');
  var extension = path.extname(req.files.avatar.name);
  var filename = req.user.login + extension;
  var source = fs.createReadStream(req.files.avatar.path);
  var dest = fs.createWriteStream('public/avatars/' + filename);
  source.pipe(dest);
  source.on('end', function() {
    db.collection('users').findAndModify({
      query: { _id: req.user._id},
      update: {$set: {avatar: '/avatars/' + filename}},
      'new': true,
    }, function(err, doc, lastErrorObject) {
      if (err) { handleDbError(err, res); }
      req.log.info({doc: doc}, 'AVA_UPDATE_END');

      res.send(200, stripOut(doc));
    });
  });
  source.on('error', function(err) {
    res.send(502, {error: 'Unexpected error with avatar upload'});
  });
});

function handleDbError(err, res) {
  return res.send(500, JSON.stringify({
    error: 'Database error:' + (err.message || 'unknown error')
  }));
}

module.exports = server;
