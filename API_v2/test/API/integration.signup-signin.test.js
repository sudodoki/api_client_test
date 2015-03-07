/**
 * This test checks that the user registered through /signup can login throught /signin
 */

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

process.env.NODE_ENV = 'test';

const root = '../../';
const app = require(root + 'index');

// TODO: probably we should create some registry and move db, logger etc initislisation there
// in order to avoid of duplication
var mongojs = require('mongojs');
var nconfInstance = require(root + 'nconf-wrapper');
var db = mongojs(nconfInstance.get('dbName'));

describe('signup-signin integration', function() {
  beforeEach(function() {
    db.collection('users').drop();
  });

  it('should return error if user exists', function(done) {
    var user = {
      login: 'kitty',
      password: '***'
    };

    request(app)
      .post('/signup')
      .send({login: user.login, password: user.password, passwordConfirmation: user.password})
      .expect(200)
      .end(function(err) {
        if (err) return done(err);

        request(app)
          .post('/signin')
          .send(user)
          .expect(200)
          .end(done);
      });
  });
});

