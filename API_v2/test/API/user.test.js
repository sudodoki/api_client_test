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

var endPoint = '/user';
var userList = require(root + 'scripts/fixtures');
userList = JSON.parse(JSON.stringify(userList));
userList = userList.map(function(item, index) {
  item._id = index;
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


describe('GET ' + endPoint, function() {
  beforeEach(function(done) {
    db.collection('users').drop();
    db.collection('users').insert(userList, done);
  });

  it('should return only published users', function(done) {
    request(app)
      .get(endPoint)
      .expect(200)
      .expect(publicUserList)
      .end(done);
  });

  it('should not return password', function(done) {
    request(app)
      .get(endPoint)
      .expect(200)
      .expect(hasNoField('password'))
      .end(done);
  });

  it('should not return is_published', function(done) {
    request(app)
      .get(endPoint)
      .expect(200)
      .expect(hasNoField('is_published'))
      .end(done);
  });
});

function hasNoField(field) {
  return function(res) {
    if (res.body.some(function(item) {return item[field];})) {
      return 'Expected no '+field+', but get ' . item[field];
    }
  };
}
