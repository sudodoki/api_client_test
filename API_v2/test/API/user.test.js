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

// user for testing auth
var user = JSON.parse(JSON.stringify(userList[0]));
var publicUser = JSON.parse(JSON.stringify(publicUserList[0]));
var privateUser = JSON.parse(JSON.stringify(userList.filter(function(item) {
  return !item.is_published;
})[0]));

function resetDb(done) {
  db.collection('users').drop(function() {
    db.collection('users').insert(userList, done);
  });
}


describe('GET /user', function() {
  beforeEach(resetDb);

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
  function basicAuthTest(endPoint) {
    it('should return 401 for when no token', function(done) {
      request(app)
        .get(endPoint)
        .expect(401)
        .end(done);
    });

    it('should should not accept token in wrong format', function(done) {
      // error caused by using of mongojs.ObjectId()

      request(app)
        .get(endPoint)
        .set('secret-token', 'wrong token')
        .expect(500)
        .end(done);
    });

    it('should return 401 when wrong token', function(done) {
      request(app)
        .get(endPoint)
        .set('secret-token', 'zxcvbnmasdfg')
        .expect(401)
        .expect('{"error":"Need to be logged in"}')
        .end(done);
    });
  }

  beforeEach(resetDb);

  describe('GET /user/me', function() {
    basicAuthTest('/user/me');

    it('should return user info by auth token', function(done) {
      request(app)
        .get('/user/me')
        .set('secret-token', user._id)
        .expect(200)
        .expect(user)
        .end(done);
    });
  });

  describe('GET /user/:id', function() {
    basicAuthTest('/user/' + user._id);

    it('should return user info', function(done) {
      request(app)
        .get('/user/' + publicUser._id)
        .set('secret-token', user._id)
        .expect(200)
        .expect(publicUser)
        .end(done);
    });

    it('should not return non-public profiles', function(done) {
      request(app)
        .get('/user/' + privateUser._id)
        .set('secret-token', user._id)
        .expect(404)
        .expect('{"error":"User does not exist"}')
        .end(done);
    });

    it('should return 404 if we searching for non existed user', function(done) {
      request(app)
        .get('/user/xxxxxxxxxxxx')
        .set('secret-token', user._id)
        .expect(404)
        .expect('{"error":"User does not exist"}')
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
