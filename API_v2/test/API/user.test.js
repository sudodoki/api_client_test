const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
var exceptValidationError = require('./utils/exceptValidationError');

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

function authRequest(uri, method) {
  method = method || 'get';

  return request(app)
        [method](uri)
        .set('secret-token', user._id);
}

function hasNoField(field) {
  return function(res) {
    if (res.body.some(function(item) {return item[field];})) {
      return 'Expected no '+field+', but get ' . item[field];
    }
  };
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
  function basicAuthTest(endPoint, method) {
    method = method || 'get';
    it('should return 401 for when no token', function(done) {
      request(app)
        [method](endPoint)
        .expect(401)
        .end(done);
    });

    it('should should not accept token in wrong format', function(done) {
      // error caused by using of mongojs.ObjectId()

      request(app)
        [method](endPoint)
        .set('secret-token', 'wrong token')
        .expect(500)
        .end(done);
    });

    it('should return 401 when wrong token', function(done) {
      request(app)
        [method](endPoint)
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
      authRequest('/user/me')
        .expect(200)
        .expect(user)
        .end(done);
    });
  });

  describe('GET /user/:id', function() {
    basicAuthTest('/user/' + user._id);

    it('should return user info', function(done) {
      authRequest('/user/' + publicUser._id)
        .expect(200)
        .expect(publicUser)
        .end(done);
    });

    it('should not return non-public profiles', function(done) {
      authRequest('/user/' + privateUser._id)
        .expect(404)
        .expect('{"error":"User does not exist"}')
        .end(done);
    });

    it('should return 404 if we searching for non existed user', function(done) {
      authRequest('/user/xxxxxxxxxxxx')
        .expect(404)
        .expect('{"error":"User does not exist"}')
        .end(done);
    });
  });

  describe('POST /user/me', function() {
    basicAuthTest('/user/me', 'post');

    it('should return change profile data of me', function(done) {
      var expected = 'kitty';

      authRequest('/user/me', 'post')
        .send({name: expected})
        .expect(200)
        .end(function() {
          db.collection('users').findOne({_id: mongojs.ObjectId(user._id)}, function(err, doc) {
            expect(doc.name).to.equal(expected);
            done();
          });
        });
    });
  });

  describe('POST /user/me/avatar', function() {
    basicAuthTest('/user/me/avatar', 'post');

    var sinon = require('sinon');
    var fs = require('fs');
    var avatarStream;

    beforeEach(function() {
      avatarStream = {
        on: function(eventName, func) {
          if (eventName == this.fireEvent) {
            func();
          }
        },
        fireEvent: 'end',
        pipe: sinon.spy(),
        willFail: function() {
          this.fireEvent = 'error';
        }
      };
    });

    afterEach(function() {
      if (fs.createWriteStream.restore) {
        fs.createWriteStream.restore();
      }
      if (fs.createReadStream.restore) {
        fs.createReadStream.restore();
      }
    });

    function postAvatar() {
      var req = authRequest('/user/me/avatar', 'post')
        .attach('avatar', 'test/fixtures/kottans.png');

      // we can set our spies only after supertest finishes with image attachments
      sinon.stub(fs, 'createWriteStream');
      sinon.stub(fs, 'createReadStream').returns(avatarStream);

      return req;
    }

    it('should return error if no image uploaded', function(done) {
      authRequest('/user/me/avatar', 'post')
        .expect(422)
        .expect(exceptValidationError('avatar'))
        .end(done);
    });

    it('should read uploaded file', function(done) {
      postAvatar()
        .expect(200)
        .end(function() {
          // we have only one file in request, so it is enough to check that
          // it was read from tmp dir
          expect(fs.createReadStream.calledWithMatch(/\/tmp\/.*\.png/)).to.be.equal(true);

          done();
        });
    });

    it('should save the uploaded image', function(done) {
      postAvatar()
        .expect(200)
        .end(function() {
          expect(avatarStream.pipe.calledOnce).to.be.equal(true);
          done();
        });
    });

    it('should save image under public/avatars', function(done) {
      postAvatar()
        .expect(200)
        .end(function() {
          expect(fs.createWriteStream.calledWithMatch(/public\/avatars\/.*\.png/)).to.be.equal(true);

          done();
        });
    });

    it('it should name image as `user.login`.ext', function(done) {
      postAvatar()
        .expect(200)
        .end(function(err, res) {
          expect(fs.createWriteStream.calledWithMatch(
            new RegExp(res.body.login+'\\.png')
          )).to.be.equal(true);

          done();
        });
    });

    it('should update users profile with new image link', function(done) {
      postAvatar()
        .expect(200)
        .end(function() {
          db.collection('users').findOne({_id: mongojs.ObjectId(user._id)}, function(err, doc) {
            expect(doc.avatar).to.not.equal(user.avatar);
            expect(doc.avatar).to.match(/\/avatars\//);

            done();
          });
        });
    });

    it('should return error on fail', function(done) {
      avatarStream.willFail();

      postAvatar()
        .expect(502)
        .expect('{"error":"Unexpected error with avatar upload"}')
        .end(done);
    });
  });
});
