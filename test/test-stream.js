var array = require('stream-array');
var path  = require('path');
var File  = require('vinyl');

module.exports = function () {
  var args = Array.prototype.slice.call(arguments);

  var i = 0;

  return array(args.map(function (contents) {
    return new File({
      cwd: path.join(__dirname, '/'),
      base: path.join(__dirname, '/fixtures'),
      path: path.join(__dirname, '/fixtures/file' + (i++).toString() + '.scss'),
      contents: new Buffer(contents)
    });
  }));
}
