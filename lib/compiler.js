/*
 * gulp-shopify-sass: lib/compiler.js
 */

// TODO: consider to switch to c++ to boost up performance
var path      = require('path');
var clonedeep = require('lodash.clonedeep');
var vfile     = require('vinyl-file');
var vinyl     = require('vinyl');
/**
 * Get options
 *
 * @param {Object} options
 * @api private
 */

function getOptions(opts, cb) {
  var options = clonedeep(opts || {});

  options.sourceComments = options.sourceComments || false;
  if (options.hasOwnProperty('file')) {
    options.file = getInputFile(options);
  }
  options.outFile = getOutputFile(options);
  options.includePaths = buildIncludePaths(options);

  // context object represents node-sass environment
  options.context = { options: options, callback: cb };

  options.result = {
    stats: getStats(options)
  };

  return options;
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

  return new Error('File to import: "' + dir + '" not found.');
}


function importReplacer (options) {

  var rex = /@import\s*(?:(?:'([^']+)')|(?:"([^"]+)"))\s*;\s*$/gmi;
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


/**
 * Render
 *
 * @param {Object}    opts
 * @param {cb}        function
 */

module.exports.render = function(opts, callback) {
  var options = getOptions(opts, cb);

  // options.error and options.success are for libsass binding
  options.error = function(err) {
    var payload = assign(new Error(), JSON.parse(err));

    if (cb) {
      options.context.callback.call(options.context, payload, null);
    }
  };

  options.success = function() {
    var result = options.result;
    var stats = endStats(result.stats);
    var payload = {
      css: result.css,
      map: result.map,
      stats: stats
    };

    if (cb) {
      options.context.callback.call(options.context, null, payload);
    }
  };

  // todo
  importReplacer(options, cb);
};

/**
 * Render sync
 *
 * @param {Object} options
 * @api public
 */

module.exports.renderSync = function(opts) {
  var options = getOptions(opts);
  var importer = options.importer;

  // todo
  var status = importReplacer(options);

  var result = options.result;

  if (status) {
    result.stats = endStats(result.stats);
    return result;
  }

  throw assign(new Error(), JSON.parse(result.error));
};