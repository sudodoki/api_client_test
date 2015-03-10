var db = require('../services/db');

var uid = require('rand-token').uid;
var passport = require('passport');

var LocalStrategy = require('passport-local').Strategy;
var TokenStrategy = require('passport-token').Strategy;

const TOKEN_LENGTH = 16;

// POST /signin to get token
passport.use(new LocalStrategy({
    usernameField: 'login'
  },
  function(login, password, done) {
    db.collection('users').findOne({ login: login, password: password }, function (err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      user.token = uid(TOKEN_LENGTH);

      db.collection('users').save(user, function (err, user) {
        done(null, user);
      });
    });
  }
));

// Token-based Auth for access to protected API areas
passport.use(new TokenStrategy({
    tokenHeader: 'secret-token',
    usernameHeader: 'secret-token',
  },
  function (_, token, done) {
    db.collection('users').findOne({ token: token }, function (err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    });
  }
));

module.exports = function() {
  return passport;
};
