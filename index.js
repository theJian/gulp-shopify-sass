'use strict';

var path      = require('path');
var gutil     = require('gulp-util');
var through   = require('through2');
var clonedeep = require('lodash.clonedeep');

const PLUGIN_NAME = 'gulp-shopify-sass';

/*
 * Most of the code in index.js are copied from gulp-sass
 */

//////////////////////////////
// Main Gulp Shopify Sass function
//////////////////////////////
var gulpShopifySass = function gulpShopifySass (options, sync) {
  return through.obj(function (file, enc, cb) {

    var opts, contents;

    if (file.isNull()) {
      return cb(null, file);
    }

    // do not support stream
    if(file.isStream()) {
      return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported!'));
    }

    //////////////////////////////
    // Handles returning the file to the stream
    //////////////////////////////
    var filePush = function filePush(contents) {
    //   console.log(file);
    //   console.log(file.contents);
    //   console.log(contents);
    // file = new gutil.File({
    //     'cwd': __dirname,
    //     'base': file.base,
    //     'path': gutil.replaceExtension(file.path, '.cat.scss.liquid'),
    //     'contents': contents
    // });

      file.contents = new Buffer(contents);
      file.path = gutil.replaceExtension(file.path, '.cat.scss.liquid');

      cb(null, file);
    };

    //////////////////////////////
    // Handles error message
    //////////////////////////////
    var errorM = function errorM(error) {
      var relativePath = '',
          filePath = error.file === 'stdin' ? file.path : error.file,
          message = '';

      filePath = filePath ? filePath : file.path;
      relativePath = path.relative(process.cwd(), filePath);

      message += gutil.colors.underline(relativePath) + '\n';
      message += error.formatted;

      error.messageFormatted = message;
      error.messageOriginal = error.message;
      // error.message = gutil.colors.stripColor(message);

      error.relativePath = relativePath;

      return cb(new gutil.PluginError(
          PLUGIN_NAME, error
        ));
    };

    // processing buffer
    if(file.isBuffer()) {
    //////////////////////////////
    // gulpShopifySass main process BEGIN
    //////////////////////////////

      opts = clonedeep(options || {});
      opts.data = file.contents.toString();

      // we set the file path here so that libsass can correctly resolve import paths
      opts.file = file.path;

      // TODO: add includePaths feature in options and relavent processer

      // Ensure file's parent directory in the include path
      // if (opts.includePaths) {
      //   if (typeof opts.includePaths === 'string') {
      //     opts.includePaths = [opts.includePaths];
      //   }
      // } else {
      //   opts.includePaths = [];
      // }

      // opts.includePaths.unshift(path.dirname(file.path));

      // TDDO: enable sync option once async render is done. Only support renderSync for now
      // if (sync === true) {
        //////////////////////////////
        // Sync Sass render
        //////////////////////////////

        try {
          contents = gulpShopifySass.compiler.renderSync(opts);

          filePush(contents);
        } catch (error) {
          return errorM(error);
        }

      // } else {
      //   //////////////////////////////
      //   // Async Sass render
      //   //////////////////////////////
      //   var callback = function(error, catFile) {
      //     if (error) {
      //       return errorM(error);
      //     }
      //     filePush(catFile);
      //   };

      //   gulpShopifySass.compiler.render(opts, callback);  
      // }
      //////////////////////////////
      // gulpShopifySass main process END
      //////////////////////////////
    }
  });
}

//////////////////////////////
// Sync Shopify Sass render
//////////////////////////////

// TDDO: enable sync option once async render is done. Only support renderSync for now

// gulpShopifySass.sync = function sync(options) {
//   return gulpShopifySass(options, true);
// };

//////////////////////////////
// Log errors nicely
//////////////////////////////
gulpShopifySass.logError = function logError(error) {
  var message = new gutil.PluginError('sass', error.messageFormatted).toString();
  process.stderr.write(message + '\n');
  this.emit('end');
};

//////////////////////////////
// Store compiler in a prop
//////////////////////////////
gulpShopifySass.compiler = require('./lib/compiler');

module.exports = gulpShopifySass;
