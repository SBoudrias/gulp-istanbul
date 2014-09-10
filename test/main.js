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
        assert.ok(file.contents.toString().indexOf('$$cov_') >= 0);
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

      this.stream.on('error', function (err) {
        assert.ok(err);
        done();
      });

      this.stream.write(srcFile);
      this.stream.end();
    });
  });

  describe('istanbul.summarizeCoverage()', function () {

    it('gets statistics about the test run', function (done) {
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul())
        .on('finish', function () {
          process.stdout.write = function () {};
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha({ reporter: 'spec' }))
            .on('finish', function () {

              var data = istanbul.summarizeCoverage();
              assert.ok(data.lines.pct === 50);
              assert.ok(data.statements.pct === 50);
              assert.ok(data.functions.pct === 0);
              assert.ok(data.branches.pct === 100);
              done();
            });
        });
    });

    it('allows inclusion of untested files', function (done) {
      var COV_VAR = 'untestedCovVar';

      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul({
            coverageVariable: COV_VAR,
            includeUntested: true
        }))
        .on('finish', function () {
          process.stdout.write = function () {};
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha({ reporter: 'spec' }))
            .on('finish', function () {

              var data = istanbul.summarizeCoverage({
                  coverageVariable: COV_VAR
              });

              // If untested files are included, line and statement coverage
              // drops to 25%
              assert.ok(data.lines.pct === 25);
              assert.ok(data.statements.pct === 25);
              assert.ok(data.functions.pct === 0);
              assert.ok(data.branches.pct === 100);
              done();
            });
        });
    });
  });

  describe('istanbul.writeReports()', function () {
    beforeEach(function (done) {
      // set up coverage
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .on('end', done)
        .pipe(istanbul());
    });

    afterEach(function () {
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
      };
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

    it('allow specifying report output dir (legacy way)', function (done) {
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

    it('allow specifying report output dir', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports({ dir: 'cov-foo' }))
        .on('end', function () {
          assert.ok(fs.existsSync('./cov-foo'));
          assert.ok(fs.existsSync('./cov-foo/lcov.info'));
          assert.ok(fs.existsSync('./cov-foo/coverage-final.json'));
          process.stdout.write = out;
          done();
        });
    });

    it('allow specifying report output formats', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha({ reporter: 'spec' }))
        .pipe(istanbul.writeReports({ dir: 'cov-foo', reporters: ['cobertura'] }))
        .on('end', function () {
          assert.ok(fs.existsSync('./cov-foo'));
          assert.ok(!fs.existsSync('./cov-foo/lcov.info'));
          assert.ok(fs.existsSync('./cov-foo/cobertura-coverage.xml'));
          process.stdout.write = out;
          done();
        });
    });

    it('throws when specifying invalid reporters', function () {
      var actualErr;
      try {
        istanbul.writeReports({ reporters: ['not-a-valid-reporter'] });
      } catch (err) {
        actualErr = err;
      }
      assert.ok(actualErr.plugin === 'gulp-istanbul');
    });

  });

  describe('with defined coverageVariable option', function () {
    afterEach(function () {
      rimraf.sync('coverage');
    });

    it('allow specifying coverage variable', function (done) {
      process.stdout.write = function () {};

      var coverageVariable = 'CUSTOM_COVERAGE_VARIABLE';

      // set up coverage
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul({ coverageVariable: coverageVariable }))
        .on('finish', function () {
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha({ reporter: 'spec' }))
            .pipe(istanbul.writeReports({ coverageVariable: coverageVariable }))
            .on('end', function () {
              assert.ok(fs.existsSync('./coverage'));
              assert.ok(fs.existsSync('./coverage/lcov.info'));
              assert.ok(fs.existsSync('./coverage/coverage-final.json'));
              done();
            });
        });
    });
  });
});
