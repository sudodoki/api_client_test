module.exports = {
  CORSHanlder: require('./cors')(),
  forAuthorized: require('./authorized')(),
  setUser: require('./setUser')()
};
