const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

var exceptValidationError = require('./utils/exceptValidationError');

const app = require(root + 'index');
var db = require(root + 'services/db');

var endPoint = '/signup';

describe('GET ' + endPoint, function() {
  it('should return 404', function(done) {
    request(app)
      .get(endPoint)
      .expect(204)
      .end(done);
  });
});

describe('POST ' + endPoint, function() {
  beforeEach(function(done) {
    db.collection('users').drop(function() {done();});
  });

  it('should require login, password and passwordConfirmation', function(done) {
    request(app)
      .post(endPoint)
      .send()
      .expect(422)
      .expect(exceptValidationError('login', 'password', 'passwordConfirmation'))
      .end(done);
  });

  it('should register new user', function(done) {
    request(app)
      .post(endPoint)
      .send({login: 'test', password: 'test', passwordConfirmation: 'test'})
      .expect(200)
      .expect(/"token":"[^"]+"/)
      .end(done);
  });

  it('should return error if user exists', function(done) {
    var doRequest = function() {
      return request(app)
        .post(endPoint)
        .send({login: 'test', password: 'test', passwordConfirmation: 'test'});
    };

    doRequest()
      .expect(200)
      .end(function(err) {
        if (err) return done(err);

        doRequest()
          .expect(422)
          .expect(exceptValidationError('login')) // this login is already taken
          .end(done);
      });
  });
});
