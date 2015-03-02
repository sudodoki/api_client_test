var nconfInstance = require('../nconf-wrapper')
module.exports = {
  CORSHanlder: require('./cors')(nconfInstance),
  forAuthorized: require('./authorized')(nconfInstance),
  setUser: require('./setUser')(nconfInstance)
};
