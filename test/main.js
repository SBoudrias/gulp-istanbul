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

    afterEach(function () {
      rimraf.sync('coverage');
      rimraf.sync('cov-foo');
      rimraf.sync('cov-bar');
      rimraf.sync('cov-baz');
      process.stdout.write = out;
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

    it('allow specifying report output dir the old way', function (done) {
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

    it('allow specifying report output dir the new way', function (done) {
      process.stdout.write = function () {};
      var dir = 'cov-bar';
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports({dir:dir}))
        .on('end', function () {
          assert.ok(fs.existsSync('./'+dir));
          assert.ok(fs.existsSync('./'+dir+'/lcov.info'));
          assert.ok(fs.existsSync('./'+dir+'/coverage-final.json'));
          done();
        });
    });

    it('allow specifying report output dir and reports', function (done) {
      process.stdout.write = function () {};
      var dir = 'cov-baz';
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports({dir:dir, reports: ['json']}))
        .on('end', function () {
          assert.ok(fs.existsSync('./'+dir));
          assert.ok(fs.existsSync('./'+dir+'/coverage-final.json'));
          done();
        });
    });

    it('throws when specifying invalid reporters', function (done) {
      var actualErr;
      try {
        istanbul.writeReports({reports:['not-a-valid-reporter']});
      } catch (err) {
        actualErr = err;
      }
      assert.ok(actualErr.plugin === 'gulp-istanbul');
      done();
    });
  });
});
