'use strict';

var through = require('through2');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var vfile = require('vinyl-file');
var vinyl = require('vinyl');
var fileExists = require('file-exists');

const PLUGIN_NAME = 'gulp-shopify-sass';

function addUnderscore(fileName) {
  const index = fileName.lastIndexOf("/") + 1;

  const start = fileName.substring(0, index);
  const end = fileName.substring(index, fileName.length);

  return start + '_' + end;
}


function checkFileExists(fileName) {
  // if .scss is not specified at the end
  const withExtension = fileName + '.scss';

  // if the file name is missing the partial '_'
  const withUnderscore = addUnderscore(fileName);

  // if the file name is missing both the .scss extension and the partial '_'
  const withUnderscoreAndExtension = withUnderscore + '.scss';


  if(fileExists(fileName)) {
    return fileName;
  }

  if(fileExists(withExtension)) {
    return withExtension;
  }

  if(fileExists(withUnderscore)) {
    return withUnderscore;
  }

  if(fileExists(withUnderscoreAndExtension)) {
    return withUnderscoreAndExtension;
  }

  gutil.log('File to import: "' + fileName + '" not found.');

  return false;
}


function importReplacer (file) {

  var rex = /@import\s*(("([^"]+)")|('([^']+)'))\s*;/g;
  var fileContents = file.contents.toString();
  var fileDirname = path.dirname(file.path);
  var imports = {};
  var match;

  while(match = rex.exec(fileContents)) {

    // [3] double quotes
    // [5] single quotes
    var importFile = path.join(fileDirname, (match[3] || match[5]));

    const fileExistCheck = checkFileExists(importFile);

    // if file exists, replace it
    if(fileExistCheck) {
      imports[match[0]] = fileExistCheck;
    }

  }

  for(let imp in imports) {
    // replace @import with import file contents
    fileContents = fileContents.replace(new RegExp(imp, 'g'), importReplacer(vfile.readSync(imports[imp])).contents.toString());
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
