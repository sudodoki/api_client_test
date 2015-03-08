const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const root = '../../';
const app = require(root + 'index');

// TODO: probably we should create some registry and move db, logger etc initislisation there
// in order to avoid of duplication
process.env.NODE_ENV = 'test';
var mongojs = require('mongojs');
var nconfInstance = require(root + 'nconf-wrapper');
var db = mongojs(nconfInstance.get('dbName'));

var endPoint = '/signin';


describe('GET ' + endPoint, function() {
  it('should return 404', function(done) {
    request(app)
      .get(endPoint)
      .expect(204)
      .end(done);
  });
});

describe('POST ' + endPoint, function() {
  var user;

  beforeEach(function(done) {
    user = {
      login: 'kitty',
      password: '***'
    };

    db.collection('users').drop(function() {
      db.collection('users').insert(user, done);
    });
  });

  it('should require login and password', function(done) {
    request(app)
      .post(endPoint)
      .send()
      .expect(400)
      .expect(/"error"/)
      .end(done);
  });

  it('should not accept wrong password', function(done) {
    user.password = 'angry hacker';

    request(app)
      .post(endPoint)
      .send(user)
      .expect(403)
      .expect(/Wrong login or password/)
      .end(done);
  });

  it('should not accept wrong password', function(done) {
    user.login = 'doggie';

    request(app)
      .post(endPoint)
      .send(user)
      .expect(403)
      .expect(/Wrong login or password/)
      .end(done);
  });

  it('should return token', function(done) {
    request(app)
      .post(endPoint)
      .send(user)
      .expect(200)
      .expect(/"token":"[^"]+"/)
      .end(done);
  });
});
