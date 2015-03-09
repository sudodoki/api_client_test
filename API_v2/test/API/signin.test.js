const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const app = require(root + 'index');
var db = require(root + 'services/db');

var endPoint = '/signin';


describe('GET ' + endPoint, function() {
  it('should return 204 No Content', function(done) {
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
      _id: db.ObjectId(),
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
      .expect(422)
      .expect(/"error"/)
      .end(done);
  });

  it('should not accept wrong password', function(done) {
    user.password = 'angry hacker';

    request(app)
      .post(endPoint)
      .send(user)
      .expect(401)
      .end(done);
  });

  it('should not login user that not exists', function(done) {
    user.login = 'doggie';

    request(app)
      .post(endPoint)
      .send(user)
      .expect(401)
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

  it('should save token to db', function(done) {
    request(app)
      .post(endPoint)
      .send(user)
      .expect(200)
      .end(function() {
        db.collection('users').findOne({_id: db.ObjectId(user._id)}, function(err, doc) {
          expect(doc.token).to.have.length(16);
          expect(doc._id.toString()).to.be.equal(user._id.toString());

          done();
        });
      });
  });
});
