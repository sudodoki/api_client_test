const root = '../../';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
var exceptValidationError = require('./utils/exceptValidationError');

const app = require(root + 'index');
var db = require(root + 'services/db');

var usersFixture = require(root + 'test/fixtures/users');
var user = usersFixture.user;
var publicUser = usersFixture.publicUser;

describe('GET /user', function() {
  beforeEach(usersFixture.resetDb);

  it('should return only published users', function(done) {
    request(app)
      .get('/user')
      .expect(200)
      .expect(usersFixture.publicUsersList)
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

function hasNoField(field) {
  return function(res) {
    if (res.body.some(function(item) {return item[field];})) {
      return 'Expected no '+field+', but get ' . item[field];
    }
  };
}

describe('/user: authorized', function() {
  function basicAuthTest(endPoint, method) {
    method = method || 'get';
    it('should return 401 for empty token', function(done) {
      request(app)
        [method](endPoint)
        .expect(401)
        .end(done);
    });

    it('should return 401 when wrong token', function(done) {
      request(app)
        [method](endPoint)
        .set('secret-token', 'wrong token')
        .expect(401)
        .end(done);
    });
  }

  function authRequest(uri, method) {
    method = method || 'get';

    return request(app)
          [method](uri)
          .set('secret-token', user.token);
  }

  beforeEach(usersFixture.resetDb);

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
      authRequest('/user/' + usersFixture.privateUser._id)
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
        .end(function(err, res) {
          db.collection('users').findOne({_id: db.ObjectId(user._id)}, function(err, doc) {
            expect(doc.name).to.equal(expected);
            expect(res.body.name).to.equal(expected);

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
        .end(function(err, res) {
          db.collection('users').findOne({_id: db.ObjectId(user._id)}, function(err, doc) {
            expect(doc.avatar).to.not.equal(user.avatar);
            expect(doc.avatar).to.match(/^\/avatars\//);

            expect(res.body.avatar).to.match(/^http/);
            expect(res.body.avatar).to.contain(doc.avatar);

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
