var assert = require('stream-assert');
var should = require('should');
var File = require('vinyl');
var gulp = require('gulp');
var path = require('path');
var gutil = require('gulp-util');
var fs = require('fs');
var gulpShopifySass = require('../index');

var createVinyl = function createVinyl(filename, contents) {
    var base = path.join(__dirname, 'fixtures', 'scss');
    var filePath = path.join(base, filename);
    return new gutil.File({
        'cwd': __dirname,
        'base': base,
        'path': filePath,
        'contents': contents || fs.readFileSync(filePath)
    });
};

describe('gulp-shopify-sass', function() {
    it('skip files doesn\'t exist', function(done) {
        var stream = gulpShopifySass();
        var emptyFile = {
            'isNull': function() {
                return true;
            }
        };

        stream.on('data', function (data) {
            data.should.equal(emptyFile);
            done();
        });

        stream.write(emptyFile);
    });

    it('should emit error when file isStream()', function(done) {
        var stream = gulpShopifySass();
        var streamFile = {
            'isNull': function() {
                return false;
            },
            'isStream': function() {
                return true;
            }
        };

        stream.on('error', function (err) {
            err.message.should.equal('Streaming not supported!');
            done();
        });

        stream.write(streamFile);
    });

    it('should compile an empty sass file', function(done) {
        var sassFile = createVinyl('empty.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'empty.cat.scss.liquid');
            String(catScssFile.contents).should.equal('');
            done();
        });

        stream.write(sassFile);
    });

    it('work on single sass file', function(done) {
        var sassFile = createVinyl('_single.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), '_single.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'scss', '_single.scss'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

    it('should replace import', function(done) {
        var sassFile = createVinyl('import.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'import.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'scss', '_single.scss'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

    it('replace import recursively', function(done) {
        var sassFile = createVinyl('recursive.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'recursive.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'scss', '_single.scss'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

    it('replace multiple import', function(done) {
        var sassFile = createVinyl('multiple.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'multiple.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'expected', 'multiple.cat.scss.liquid'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

    it('replace import with different name variations', function(done) {
        var sassFile = createVinyl('variations.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'variations.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'expected', 'variations.cat.scss.liquid'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

    it('replace import .scss.liquid', function(done) {
        var sassFile = createVinyl('import.liquid.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'import.liquid.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'expected', 'import.liquid.cat.scss.liquid'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

    it('do not import .scss.liquid if .scss exist', function(done) {
        var sassFile = createVinyl('extensionOverride.scss');
        var stream = gulpShopifySass();

        stream.on('data', function(catScssFile) {
            should.exist(catScssFile);
            should.exist(catScssFile.path);
            should.exist(catScssFile.relative);
            should.exist(catScssFile.contents);
            should.equal(path.basename(catScssFile.path), 'extensionOverride.cat.scss.liquid');
            String(catScssFile.contents).should.equal(
                fs.readFileSync(path.join(__dirname, 'fixtures', 'expected', 'extentionOverride.cat.scss.liquid'), 'utf8')
            );
            done();
        });

        stream.write(sassFile);
    });

});