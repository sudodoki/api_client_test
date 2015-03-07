module.exports = function exceptValidationError() {
  var expectedAttributes = [].slice.apply(arguments);
  return function(res) {
    if (!res.body.errors) {
      return 'request should have validation errors, but returned no errors';
    }

    var actualAttributes = res.body.errors.map(function(item) {
      return Object.keys(item)[0];
    });

    if (actualAttributes.length != expectedAttributes.length) {
      return 'Actual error attributes length does not match expected';
    }

    expectedAttributes.forEach(function (attribute) {
      if (actualAttributes.indexOf(attribute) == -1) {
        throw new Error('Expected "'+attribute+'" to be required, but it wasn\'t');
      }
    });
  };
};
