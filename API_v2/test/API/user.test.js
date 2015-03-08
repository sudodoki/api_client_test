const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

// TODO: probably we should create some registry and move db, logger etc initislisation there
// in order to avoid of duplication
process.env.NODE_ENV = 'test';
var mongojs = require('mongojs');
var nconfInstance = require(root + 'nconf-wrapper');
var db = mongojs(nconfInstance.get('dbName'));

const app = require(root + 'index');

var userList = require(root + 'scripts/fixtures');
userList = JSON.parse(JSON.stringify(userList));
userList = userList.map(function(item, index) {
  item._id = mongojs.ObjectId();
  item.passowrd = index;
  return item;
});

var publicUserList = JSON.parse(JSON.stringify(userList));
publicUserList = publicUserList.filter(function(item) {
  return item.is_published;
}).map(function(item) {
  delete item.is_published;
  delete item.password;

  return item;
});


describe('GET /user', function() {
  beforeEach(function(done) {
    db.collection('users').drop(function() {
      db.collection('users').insert(userList, done);
    });
  });

  it('should return only published users', function(done) {
    request(app)
      .get('/user')
      .expect(200)
      .expect(publicUserList)
      .end(done);
  });

  it('should not return password', function(done) {
    request(app)
      .get('/user')
      .expect(200)
      .expect(hasNoField('password'))
      .end(done);
  });

  it('should not return is_published', function(done) {
    request(app)
      .get('/user')
      .expect(200)
      .expect(hasNoField('is_published'))
      .end(done);
  });
});

describe('/user: authorized', function() {
  beforeEach(function(done) {
    db.collection('users').drop(function() {
      db.collection('users').insert(userList, done);
    });
  });

  describe('GET /user/me', function() {
    it('should return 401 for when no token', function(done) {
      request(app)
        .get('/user/me')
        .expect(401)
        .end(done);
    });

    it('should should not accept token in wrong format', function(done) {
      // error caused by using of mongojs.ObjectId()

      request(app)
        .get('/user/me')
        .set('secret-token', 'wrong token')
        .expect(500)
        .end(done);
    });

    it('should return 401 for when wrong token', function(done) {
      request(app)
        .get('/user/me')
        .set('secret-token', 'zxcvbnmasdfg')
        .expect(401)
        .expect('{"error":"User does not exist"}')
        .end(done);
    });

    it('should return user info by auth token', function(done) {
      var user = userList[0];
      user._id = user._id+'';

      request(app)
        .get('/user/me')
        .set('secret-token', user._id)
        .expect(200)
        .expect(user)
        .end(done);
    });
  });
});

function hasNoField(field) {
  return function(res) {
    if (res.body.some(function(item) {return item[field];})) {
      return 'Expected no '+field+', but get ' . item[field];
    }
  };
}
