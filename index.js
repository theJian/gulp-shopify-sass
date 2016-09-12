'use strict';

var through = require('through2');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var vfile = require('vinyl-file');
var vinyl = require('vinyl');
var fs = require('fs');

const PLUGIN_NAME = 'gulp-shopify-sass';

// @param:  dir                 full path and name
// @return: boolean
function checkFileExist (dir) {
  try {
    fs.accessSync(dir , fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

// @param:  dir                 full path and name
// @return: string | boolean
function analyseDir (dir) {
  // possible extension array
  const dirReg = new RegExp(/(.+\/)(.+)$/, 'g');
  const filenameReg = new RegExp(/^(\_)?(?:(.*(?=.scss))(.*)|(.*))$/, 'i');

  // split whole path into path the filename
  let pathAndName = dirReg.exec(dir);

  const filepath = pathAndName[1] || '';
  let filename = pathAndName[2] || '';

  // [0] original filename
  // [1] '_' if exist in the filename, otherwise undefined
  // [2] filename if it has extension .scss or .scss.liquid, otherwise undefined
  // [3] file extension if filename has extionsion .scss or .scss.liquid, otherwise undefined
  // [4] filename if it doesn't have extension, otherwise undefined
  let filenameFrags = filenameReg.exec(filename);

  // move filename[4] to filename[2] if filename[2] is undefined
  filenameFrags[2] = filenameFrags[2] || filenameFrags[4];

  // remove original name, all index will reduce 1
  filenameFrags.shift();

  // remove filename[4] since it's been moved to [2]
  filenameFrags.pop()

  // [0] was [1], [2] was [3]
  let prefix = filenameFrags[0] ? [filenameFrags[0]] : ['', '_'];
  let suffix = filenameFrags[2] ? [filenameFrags[2]] : ['.scss', '.scss.liquid'];
  let allCombinations = [];

  // check all possible combimations
  for (let i in prefix) {
    for (let j in suffix) {
      filenameFrags[0] = prefix[i];
      filenameFrags[2] = suffix[j];
      filename = filenameFrags.join('');

      pathAndName = path.join(filepath, filename);

      if (checkFileExist(pathAndName)) {
        return pathAndName;
      }
    }
  }

  gutil.log('File to import: "' + dir + '" not found.');

  return false;
}


function importReplacer (file) {

  var rex = /@import\s*(?:(?:'([^']+)')|(?:"([^"]+)"))\s*;/gi;
  var fileContents = file.contents.toString();
  var fileDirname = path.dirname(file.path);
  var imports = {};
  var match;

  while(match = rex.exec(fileContents)) {

    // [1] single quotes
    // [2] double quotes
    var importFile = path.join(fileDirname, (match[1] || match[2]));

    const fileExistCheck = analyseDir(importFile);

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
