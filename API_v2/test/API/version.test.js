const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const root = '../../'
const app = require(root + 'index')
const pkg = require(root + 'package.json')

describe('GET /version', function(){
  it('should have CORS hearder', function(done){
    request(app)
      .options('/version')
      .set('Origin', 'http://mysite.com')
      .set('Allow-Headers', 'Accept, X-Requested-With, Content-Type, SECRET-TOKEN, secret')
      .expect(204)
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Allow-Origin', 'http://mysite.com')
      .expect('Access-Control-Allow-Headers', 'Accept, X-Requested-With, Content-Type, SECRET-TOKEN, secret')
      .end(done)
  })
  it('should return string', function(done){
    request(app)
      .get('/version')
      .expect(200)
      .expect('"' + pkg.version + '"')
      .end(done)
  })
})