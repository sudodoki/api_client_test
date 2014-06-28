const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const root = '../../'
const app = require(root + 'index')
const pkg = require(root + 'package.json')

describe('GET /version', function(){
  it('should return string', function(done){
    request(app)
      .get('/version')
      .expect(200)
      .expect('"' + pkg.version + '"')
      .end(done)
  })
})