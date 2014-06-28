var chai = require('chai')
var assert = chai.assert
describe('Simple Test', function(){
  it('should always pass', function(){
    assert.equal(-1, [1,2,3].indexOf(5));
    assert.equal(-1, [1,2,3].indexOf(0));
  })
})
