'use strict';

var through = require('through2');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var vfile = require('vinyl-file');
var fileExists = require('file-exists');

const PLUGIN_NAME = 'gulp-shopify-sass';

function importReplacer (file) {

  var rex = /@import\s*(("([^"]+)")|('([^']+)'))\s*;/g;
  var fileContents = file.contents.toString();
  var fileDirname = file.dirname;
  var imports = {};
  var match;

  while(match = rex.exec(fileContents)) {

    // [3] double quotes
    // [5] single quotes
    var importFile = path.join(fileDirname, (match[3] || match[5]));

    // Skip files doesn't exist
    if (!fileExists(importFile)) {
      gutil.log('File to import: "' + importFile + '" not found.');
      continue;
    };

    imports[match[0]] = importFile;

  }

  for(let imp in imports) {
    // replace @import with import file contents
    fileContents = fileContents.replace(imp, importReplacer(vfile.readSync(importFile)).contents.toString());
  }

  file.contents = new Buffer(fileContents);

  return file;
}

module.exports = function  () {
  return through.obj(function (file, enc, cb) {

    // do not support stream
    if(file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    // processing buffer
    if(file.isBuffer()) {
      importReplacer(file);
    }

    this.push(file);

    cb();
  });
}