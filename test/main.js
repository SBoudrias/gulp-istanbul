/*global describe, it*/
'use strict';

var fs = require('fs');
var assert = require('assert');
var rimraf = require('rimraf');
var gutil = require('gulp-util');
var gulp = require('gulp');
var istanbul = require('../');
var mocha = require('gulp-mocha');

var out = process.stdout.write.bind(process.stdout);

describe('gulp-istanbul', function () {

  afterEach(function () {
    process.stdout.write = out; // put it back even if test fails
  });

  var libFile = new gutil.File({
    path: 'test/fixtures/lib/add.js',
    cwd: 'test/',
    base: 'test/fixtures/lib',
    contents: fs.readFileSync('test/fixtures/lib/add.js')
  });

  describe('istanbul()', function () {
    beforeEach(function () {
      this.stream = istanbul();
    });

    it('instrument files', function (done) {
      this.stream.on('data', function (file) {
        assert.equal(file.path, libFile.path);
        assert.ok(file.contents.toString().indexOf('__cov_') >= 0);
        assert.ok(file.contents.toString().indexOf('__coverage__') >= 0);
        done();
      });

      this.stream.write(libFile);
      this.stream.end();
    });

    it('should error on stream', function (done) {
      var srcFile = new gutil.File({
        path: 'test/fixtures/lib/add.js',
        cwd: 'test/',
        base: 'test/fixtures/lib',
        contents: fs.createReadStream('test/fixtures/lib/add.js')
      });

      this.stream.on('error', function(err) {
        assert.ok(err);
        done();
      });

      this.stream.write(srcFile);
      this.stream.end();
    });
  });

  describe('istanbul.writeReports()', function () {
    beforeEach(function (done) {

      istanbul = require('../');

      // set up coverage
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .on('end', done)
        .pipe(istanbul());
    });

    after(function () {
      rimraf.sync('coverage');
      rimraf.sync('cov-foo');
    });

    it('output coverage report', function (done) {
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports());

      process.stdout.write = function (str) {

        if (str.indexOf('==== Coverage summary ====') >= 0) {
          done();
        }
      }
    });

    it('create coverage report', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports())
        .on('end', function () {
          assert.ok(fs.existsSync('./coverage'));
          assert.ok(fs.existsSync('./coverage/lcov.info'));
          assert.ok(fs.existsSync('./coverage/coverage-final.json'));
          done();
        });
    });

    it('allow specifying report output dir', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports('cov-foo'))
        .on('end', function () {
          assert.ok(fs.existsSync('./cov-foo'));
          assert.ok(fs.existsSync('./cov-foo/lcov.info'));
          assert.ok(fs.existsSync('./cov-foo/coverage-final.json'));
          done();
        });
    });
  });
});
