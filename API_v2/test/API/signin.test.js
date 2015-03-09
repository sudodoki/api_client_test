const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const app = require(root + 'index');
var db = require(root + 'services/db');

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
