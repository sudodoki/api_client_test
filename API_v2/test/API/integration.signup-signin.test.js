/**
 * This test checks that the user registered through /signup can login throught /signin
 */
const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;


const app = require(root + 'index');
var db = require(root + 'services/db');

describe('signup-signin integration', function() {
  beforeEach(function(done) {
    db.collection('users').drop(function() {done();});
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

