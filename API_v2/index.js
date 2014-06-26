var restify = require('restify'),
    fs      = require('fs'),
    mongojs = require('mongojs'),
    db      = mongojs('spa_api');

var server = restify.createServer({ name: 'spa-api' })

var CORSHanlder = function(req, res, next) {
  console.log('CORSHanlder called')
  console.log('request method is ', req.method)
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Allow', 'GET, HEAD, POST, DELETE');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Accept, X-Requested-With, Content-Type, SECRET-TOKEN, secret');
  res.header('Access-Control-Request-Method', 'POST,GET');
  console.log(req.headers)
  console.log("_____________________________________________")
  next();
 }

var forAuthorized = function(req, res, next) {
  if (!req.headers['secret-token']) { res.send(401, {error: 'Need to be logged in'}) }
  next()
}

var setUser = function(req, res, next) {
  db.collection('users').findOne({_id: mongojs.ObjectId(req.headers['secret-token'])}, function(err, doc) {
    if (err || !doc) {return res.send(401, {error: 'User does not exist'})}
    req.user = doc
    next()
  })
}

var stripOut = function (user) {
  var copy
  try {
    copy = JSON.parse(JSON.stringify(user))
  } catch(e) {
    copy = {}
  }
  delete copy.password
  delete copy.is_published
  return copy

}

server
  .use(CORSHanlder)
  .use(restify.fullResponse())
  .pre(restify.pre.sanitizePath())
  .use(restify.bodyParser({keepExtensions: true}))

server.get(/\/avatars\/?.*/, restify.serveStatic({
  directory: './public'
}));

server.on('NotFound', function(req, res, cb) {
  CORSHanlder(req, res, function(){
    return res.send(404, {status: 'Not Found'})
  })
})

server.on('MethodNotAllowed', function(req, res, cb){
  CORSHanlder(req, res, function(){
    return res.send(204)
  })
})

server.listen(3000, function() {
  console.log('%s is up and running. Check out %s.', server.name, server.url)
})

server.get('/version', function(req, res, next) {
  return res.send('2.0')
})

server.post('/signin', function (req, res, next) {
  var user = req.params;
  console.log('Log in using: ', user)
  if (!user.login && !user.password) { res.send(400, {error: 'Please specify both login & password'}) }
  db.collection('users').findOne({login: user.login, password: user.password}, function (err, userDoc) {
    if (err) { return res.send (500, JSON.stringify({ error: 'Database error:' + (err.message || 'unknown error') }))}
    if (!userDoc) {
      return res.send (403, { error: 'Wrong login or password, or even both!'})
    }
    console.log('userDoc is ', userDoc)
    return res.send(200, { status: 'good to go', token: userDoc._id})
  })
})

server.post('/signup', function (req, res, next) {
  var errors = [],
      user = req.params;
  console.log('*** Sign up for: ', user)
  if (!(user.password)) {
    errors.push("Use at least some password");
  }
  if (!(user.password && user.passwordConfirmation && user.password === user.passwordConfirmation)) {
    errors.push('Should match password');
  }
  db.collection('users').find({login: user.login}, function (err, userDoc) {
    if (err) { return res.send (500, { error: 'Database error:' + (err.message || 'unknown error') })}
    if (userDoc.length > 0) {
      errors.push('This login is already taken, sorry');
    }
    if (errors.length === 0) {
      db.collection('users').insert({
        login: user.login,
        password: user.password,
        avatar: 'http://retroavatar.appspot.com/api?name='+user.login,
        is_published: false,
        email: user.email
      }, function (err, userDoc) {
        if (err) { return res.send (500, { error: 'Database error:' + (err.message || 'unknown error') })}
        console.log('inserted document is: ', userDoc)
        res.send(200, { status: 'New and shiny account for you!', token: userDoc._id})
      })
    } else {
      res.send(422, {errors: errors})
    }
  })
})


server.get('/user', function (req, res, next) {
  console.log(req.method)
  db.collection('users').find({is_published: "true"}, function (err, docs) {
    if (err) { return res.send (500, { error: 'Database error:' + (err.message || 'unknown error') })}
    res.send(docs.map(stripOut))
  })
})

server.get('/user/:id', forAuthorized, function (req, res, next) {
  db.collection('users').findOne({ _id: mongojs.ObjectId(req.headers['secret-token']), is_published: "true"}, function(err, doc) {
    if (err) { return res.send(500, { error: 'Database error:' + (err.message || 'unknown error') })}
    if (!doc) {return res.send(404, 'User does not exist')}
    return res.send(200, stripOut(doc))
  })
})

server.get('/user/me', forAuthorized, setUser, function (req, res, next) {
  return res.send(200, req.user)
})

server.post('/user/me', forAuthorized, setUser, function (req, res, next) {
  var userUpdate = { $set: req.params }
  console.log('user ', userUpdate, req.user._id)
  db.collection('users').findAndModify({
    query: { _id: req.user._id},
    update: userUpdate,
  }, function(err, doc, lastErrorObject) {
    if (err) { return res.send(500, { error: 'Database error:' + (err.message || 'unknown error') })}
    console.log(doc)
    res.send(200, doc)
  })
})

server.post('/user/me/avatar', forAuthorized, setUser, function(req, res, next){
  console.log('&&&', req.files.avatar.path)
  var extension = req.files.avatar.name.split('.').slice(-1)[0]
  var filename = req.user.login + '.' + extension
  var source = fs.createReadStream(req.files.avatar.path);
  var dest = fs.createWriteStream('public/' + filename);
  source.pipe(dest);
  source.on('end', function() {
    db.collection('users').findAndModify({
      query: { _id: req.user._id},
      update: {$set: {avatar: server.url + '/avatars/' + filename}},
    }, function(err, doc, lastErrorObject) {
      if (err) { return res.send(500, { error: 'Database error:' + (err.message || 'unknown error') })}
      if (!doc) {return res.send(404, { error: 'User does not exist'})}
      console.log(doc)
      res.send(200, doc)
    })
  });
  source.on('error', function(err) {
    res.send(502, {error: 'Unexpected error with avatar upload'})
  });
})
