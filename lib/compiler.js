/*
 * gulp-shopify-sass: lib/compiler.js
 */

// TODO: not done
/*
 * Goal: create scss syntax parser to replace RegExp, in order to add extra features, such as
 *       1. Regonize @import in comments and do not replace it
 *       2. Support includePaths option to minimize @import path length in each file
 */

'use strict';

var fs        = require('fs');
var path      = require('path');
var clonedeep = require('lodash.clonedeep');
var vfile     = require('vinyl-file');
// var vinyl     = require('vinyl');
/**
 * Get options
 *
 * @param {Object} options
 * @api private
 */

function getOptions(opts, cb) {
  var options = clonedeep(opts || {});

  // TODO: preprocess options

  // options.sourceComments = options.sourceComments || true;
  // if (options.hasOwnProperty('file')) {
  //   options.file = getInputFile(options);
  // }
  // options.outFile = getOutputFile(options);
  // options.includePaths = buildIncludePaths(options);

  // context object represents node-sass environment
  options.context = { options: options, callback: cb };

  return options;
}

/**
 * Get input file
 *
 * @param {Object} options
 * @api private
 */

function getInputFile(options) {
  return options.file ? path.resolve(options.file) : null;
}

/**
 * Get output file
 *
 * @param {Object} options
 * @api private
 */

function getOutputFile(options) {
  var outFile = options.outFile;

  if (!outFile || typeof outFile !== 'string' || (!options.data && !options.file)) {
    return null;
  }

  return path.resolve(outFile);
}

/**
 * Build an includePaths string
 * from the options.includePaths array and the SASS_PATH environment variable
 *
 * @param {Object} options
 * @api private
 */

function buildIncludePaths(options) {
  options.includePaths = options.includePaths || [];

  if (process.env.hasOwnProperty('SASS_PATH')) {
    options.includePaths = options.includePaths.concat(
      process.env.SASS_PATH.split(path.delimiter)
    );
  }

  return options.includePaths.join(path.delimiter);
}

// @param:  {string}  dir                 full path and name
// @return: {boolean}
function checkFileExist (dir) {
  try {
    fs.accessSync(dir , fs.F_OK);

    return true;
  } catch (e) {
    return false;
  }
}

// @param:  dirs                 dirs where to search the file
// @param:  file                 @import file to search
// @return: string | boolean
function analyseDirs (dirs, file) {
  // possible extension array
  const dirReg = new RegExp(/(.*\/)?(.+)$/g);
  const filenameReg = new RegExp(/^(\_)?(?:(.*(?=.scss))(.*)|(.*))$/i);

  // split whole path into path the filename
  let pathAndName = dirReg.exec(file);

  const filepath = pathAndName[1] || '';
  let filename = pathAndName[2] || '';

  // [0] original filename
  // [1] '_' if exist in the filename, otherwise undefined
  // [2] filename if it has extension .scss or .scss.liquid, otherwise undefined
  // [3] file extension if filename has extionsion .scss or .scss.liquid, otherwise undefined
  // [4] filename if it doesn't have extension, otherwise undefined
  let filenameFrags = filenameReg.exec(filename);

  // move filename[4] to filename[2] is filename[2] is undefined
  filenameFrags[2] = filenameFrags[2] || filenameFrags[4];

  let prefixs = filenameFrags[1] ? [filenameFrags[1]] : ['', '_'];
  let suffixs = filenameFrags[3] ? [filenameFrags[3]] : ['.scss', '.scss.liquid'];

  // remove original name, all index will reduce 1
  filenameFrags.shift();

  // remove filename[4] since it's been moved to [2]
  filenameFrags.pop()

  // check all possible combimations
  let dir, fullPath;
  for (let i_dir in dirs) {
    for (let i_prefix in prefixs) {
      for (let i_suffix in suffixs) {
        filenameFrags[0] = prefixs[i_prefix];
        filenameFrags[2] = suffixs[i_suffix];
        filename = filenameFrags.join('');
        fullPath = path.join(dirs[i_dir], filepath, filename);

        if (checkFileExist(fullPath)) {
          return fullPath;
        }
      }
    }
  }

  return new Error('Unable to import "' + file + '": file not found.');
}

// @param:  {object}  options
// @return: {boolean} async
function importReplacer (options, sync, prev) {

  var rex = /@import\s*(?:(?:'([^']+)')|(?:"([^"]+)"))\s*;\s*$/gmi;
  var contents = options.data;
  var dirname = path.dirname(options.file);
  var imports = {};
  var match;
  var dirs = options.includePaths.slice(0);

  if (typeof options.file !== 'undefined') {
    // Add the current file path to where to search
    dirs.unshift(path.dirname(options.file));
    // Define prev file as the current file path
    var prev = options.file;
  }

  while(match = rex.exec(contents)) {

    // [1] single quotes filename
    // [2] double quotes filename
    var importFile = match[1] || match[2];

    const fileExistCheck = {
      import: importFile,
      fullPath: analyseDirs(dirs, importFile)
    };

    // if file exists, replace it
    if(fileExistCheck) {
      imports[match[0]] = fileExistCheck;
    }
  }

  // replace @import with import file contents
  if (sync) {
    for(let filename in imports) {
      let filepath = imports[filename];
      let file = vfile.readSync(filepath);

      let newFileContent = importReplacer({
        data: file.contents.toString(),
        file: file.path,
        includePaths: dirs
      }, true, filename);

      contents = contents.replace(new RegExp(filename, 'g'), function() {
        // http://stackoverflow.com/a/28103073
        return newFileContent
      });
    }

    return contents;
  } else {

    let prevPromise = Promise.resolve(contents);

    for(let filename in imports) {
      let filepath = imports[filename].fullPath;
      let importPath = imports[filename].import;
      prevPromise = prevPromise.then(contents => {

        if (options.importer) {
          var fileDatasPromise = new Promise ((resolve, reject) => {
            let ret = options.importer(importPath, prev, resolve);
            if (ret) {
              resolve(ret);
            }
          });
        }
        else {
          var fileDatasPromise = Promise.resolve({file: filepath});
        }

        return fileDatasPromise.then(obj => {
          if (obj.content)
            var contentsPromise = Promise.resolve(obj.content);
          else
            var contentsPromise = vfile.read(obj.file).then(file => file.contents.toString());

          return contentsPromise.then(contents => {
            return importReplacer({
              data: contents,
              file: obj.file,
              includePaths: dirs,
              importer: options.importer
            }, false, filename);
          });
        }).then(newFileContent => {
          return contents.replace(new RegExp(filename, 'g'), function() {
            // http://stackoverflow.com/a/28103073
            return newFileContent
          });
        });
      });
    }

    return prevPromise;
  }
}

/**
 * Render
 *
 * @param {Object}    opts
 * @param {Function}  cb
 * @api public
 */

module.exports.render = function(opts, cb, errorCb) {
  var options = getOptions(opts, cb);

  importReplacer(options).then(cb, errorCb);
};

/**
 * Render sync
 *
 * @param {Object} options
 * @api public
 */

module.exports.renderSync = function(options) {
  // var options = getOptions(opts);
  // var importer = options.importer;
  // var status = importReplacer(options);

  return importReplacer(options, true);

  // var result = options.result;

  // if (status) {
  //   result.stats = endStats(result.stats);
  //   return result;
  // }

  // throw assign(new Error(), JSON.parse(result.error));
};
