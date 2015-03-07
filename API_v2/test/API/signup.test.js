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
  beforeEach(function() {
    db.collection('users').drop();
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
    var doRquest = function() {
      return request(app)
        .post(endPoint)
        .send({login: 'test', password: 'test', passwordConfirmation: 'test'});
    };

    doRquest()
      .expect(200)
      .end(function(err) {
        if (err) return done(err);

        doRquest()
          .expect(422)
          .expect(exceptValidationError('login')) // this login is already taken
          .end(done);
      });
  });
});

function exceptValidationError() {
  var expectedAttributes = [].slice.apply(arguments);
  return function(res) {
    if (!res.body.errors) {
      return 'request should have validation errors, but returned no errors';
    }

    var actualAttributes = res.body.errors.map(function(item) {
      return Object.keys(item)[0];
    });

    if (actualAttributes.length != expectedAttributes.length) {
      return 'Actual error attributes length does not match expected';
    }

    expectedAttributes.forEach(function (attribute) {
      if (actualAttributes.indexOf(attribute) == -1) {
        throw new Error('Expected "'+attribute+'" to be required, but it wasn\'t');
      }
    });
  };
}
