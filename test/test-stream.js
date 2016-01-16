var array = require('stream-array');
var File = require('vinyl');

module.exports = function () {
  var args = Array.prototype.slice.call(arguments);

  var i = 0;

  return array(args.map(function (contents) {
    return new File({
      cwd: '/home/jian/0x00/gulp-shopify-sass/test/',
      base: '/home/jian/0x00/gulp-shopify-sass/test/fixtures',
      path: '/home/jian/0x00/gulp-shopify-sass/test/fixtures/file' + (i++).toString() + '.scss',
      contents: new Buffer(contents)
    });
  }));
}