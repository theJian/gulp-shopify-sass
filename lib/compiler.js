/*
 * gulp-shopify-sass: lib/compiler.js
 */

// TODO: not done
/*
 * Goal: create scss syntax parser to replace RegExp, in order to add extra features, such as
 *       1. Regonize @import in comments and do not replace it
 *       2. Support includePaths option to minimize @import path length in each file
 */

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
  // options.context = { options: options, callback: cb };

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
    return false
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

  // move filename[4] to filename[2] is filename[2] is undefined
  filenameFrags[2] = filenameFrags[2] || filenameFrags[4];

  let prefix = filenameFrags[1] ? [filenameFrags[1]] : ['', '_'];
  let suffix = filenameFrags[3] ? [filenameFrags[3]] : ['.scss', '.scss.liquid'];

  // remove original name, all index will reduce 1
  filenameFrags.shift();

  // remove filename[4] since it's been moved to [2]
  filenameFrags.pop()

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

  return new Error('File to import: "' + dir + '" not found.');
}


function importReplacer (options) {

  var rex = /@import\s*(?:(?:'([^']+)')|(?:"([^"]+)"))\s*;\s*$/gmi;
  var contents = options.data;
  var dirname = path.dirname(options.file);
  var imports = {};
  var match;

  while(match = rex.exec(contents)) {

    // [1] single quotes
    // [2] double quotes
    var importFile = path.join(dirname, (match[1] || match[2]));

    const fileExistCheck = analyseDir(importFile);

    // if file exists, replace it
    if(fileExistCheck) {
      imports[match[0]] = fileExistCheck;
    }

  }

  for(let imp in imports) {

    // replace @import with import file contents
    let file = vfile.readSync(imports[imp]);
    let result = importReplacer({
      data: file.contents.toString(),
      file: file.path
    });

    contents = contents.replace(new RegExp(imp, 'g'), result);
  }

  return contents;
}

/**
 * Render
 *
 * @param {Object}    opts
 * @param {cb}        function
 * @api public
 */


// TODO: add async render functionality

// module.exports.render = function(opts, callback) {
//   var options = getOptions(opts, callback);

//   // options.error and options.success are for libsass binding
//   options.error = function(err) {
//     var payload = assign(new Error(), JSON.parse(err));

//     if (callback) {
//       options.context.callback.call(options.context, payload, null);
//     }
//   };

//   options.success = function() {
//     var result = options.result;
//     var stats = endStats(result.stats);
//     var payload = {
//       css: result.css,
//       map: result.map,
//       stats: stats
//     };

//     if (callback) {
//       options.context.callback.call(options.context, null, payload);
//     }
//   };

//   // todo
//   importReplacer(options, callback);
// };

/**
 * Render sync
 *
 * @param {Object} options
 * @api public
 */

module.exports.renderSync = function(options) {
  // var options = getOptions(opts);
  // var importer = options.importer;

  // todo
  // var status = importReplacer(options);

  return importReplacer(options);

  // var result = options.result;

  // if (status) {
  //   result.stats = endStats(result.stats);
  //   return result;
  // }

  // throw assign(new Error(), JSON.parse(result.error));
};