/**
 * fixture.resetDb() - reload the entire users collection
 * fixture.user - just user (e.g. current user)
 * fixture.publicUsersList - just user (e.g. current user)
 * fixture.privateUsersList - just user (e.g. current user)
 * fixture.publicUser - user with public available profile
 * fixture.privateUser - user with private profile
 */

var root = '../../';

var db = require(root + 'services/db');

var fakeUsers = [
  {
    'login': 'burt',
    'password': 'burt',
    'age': 30,
    'is_published': true,
    'gender': 'Female',
    'name': {
      'title': 'Mrs',
      'first': 'Burt',
      'last': 'Richard'
    },
    'email': 'burt.richard@remold.ca',
    'avatar': 'http://retroavatar.appspot.com/api?name=Marks'
  },
  {
    'login': 'jerri',
    'password': 'jerri',
    'age': 32,
    'is_published': false,
    'gender': 'Female',
    'name': {
      'title': 'Mrs',
      'first': 'Jerri',
      'last': 'Bonner'
    },
    'email': 'jerri.bonner@zillacom.net',
    'avatar': 'http://retroavatar.appspot.com/api?name=Fitzgerald'
  },
  {
    'login': 'stefanie',
    'password': 'stefanie',
    'age': 20,
    'is_published': false,
    'gender': 'Female',
    'name': {
      'title': 'Mr',
      'first': 'Stefanie',
      'last': 'Sharpe'
    },
    'email': 'stefanie.sharpe@polaria.info',
    'avatar': 'http://retroavatar.appspot.com/api?name=Ford'
  },
  {
    'login': 'marquez',
    'password': 'marquez',
    'age': 25,
    'is_published': false,
    'gender': 'Female',
    'name': {
      'title': 'Mr',
      'first': 'Marquez',
      'last': 'Hardy'
    },
    'email': 'marquez.hardy@supremia.com',
    'avatar': 'http://retroavatar.appspot.com/api?name=Shields'
  },
  {
    'login': 'ashlee',
    'password': 'ashlee',
    'age': 29,
    'is_published': true,
    'gender': 'Female',
    'name': {
      'title': 'Mr',
      'first': 'Ashlee',
      'last': 'Gomez'
    },
    'email': 'ashlee.gomez@aquacine.me',
    'avatar': 'http://retroavatar.appspot.com/api?name=Cleveland'
  }
];

fakeUsers = fakeUsers.map(function(item) {
  item._id = db.ObjectId();
  item.token = db.ObjectId().toString();
  return item;
});

var publicUsersList = JSON.parse(JSON.stringify(fakeUsers)).filter(function(item) {
  return item.is_published;
}).map(function(item) {
  delete item.is_published;
  delete item.password;
  delete item.token;

  return item;
});

var privateUsersList = JSON.parse(JSON.stringify(fakeUsers)).filter(function(item) {
  return !item.is_published;
});


// user for testing auth
var user = JSON.parse(JSON.stringify(fakeUsers[0]));
var publicUser = JSON.parse(JSON.stringify(publicUsersList[0]));
var privateUser = JSON.parse(JSON.stringify(privateUsersList[0]));

module.exports = {
  resetDb: function(done) {
    db.collection('users').drop(function() {
      db.collection('users').insert(fakeUsers, done);
    });
  },

  user: user,
  publicUsersList: publicUsersList,
  privateUsersList: privateUsersList,
  publicUser: publicUser,
  privateUser: privateUser,
};
