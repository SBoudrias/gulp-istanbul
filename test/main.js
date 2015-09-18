'use strict';

var fs = require('fs');
var assert = require('assert');
var rimraf = require('rimraf');
var gutil = require('gulp-util');
var gulp = require('gulp');
var istanbul = require('../');
var isparta = require('isparta');
var mocha = require('gulp-mocha');
var Report = require('babel-istanbul').Report;

var out = process.stdout.write.bind(process.stdout);

describe('gulp-babel-istanbul', function () {

  afterEach(function () {
    process.stdout.write = out; // put it back even if test fails
    require.cache = {};
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
        assert(file.contents.toString().indexOf('__cov_') >= 0);
        assert(file.contents.toString().indexOf('$$cov_') >= 0);
        done();
      });

      this.stream.write(libFile);
      this.stream.end();
    });

    it('throw when receiving a stream', function (done) {
      var srcFile = new gutil.File({
        path: 'test/fixtures/lib/add.js',
        cwd: 'test/',
        base: 'test/fixtures/lib',
        contents: fs.createReadStream('test/fixtures/lib/add.js')
      });

      this.stream.on('error', function (err) {
        assert(err);
        done();
      });

      this.stream.write(srcFile);
      this.stream.end();
    });

    it('handles invalid JS files', function (done) {
      var srcFile = new gutil.File({
        path: 'test/fixtures/lib/add.js',
        cwd: 'test/',
        base: 'test/fixtures/lib',
        contents: new Buffer('var a {}')
      });
      this.stream.on('error', function (err) {
        assert(err.message.indexOf('test/fixtures/lib/add.js') >= 0);
        done();
      });
      this.stream.write(srcFile);
      this.stream.end();
    });
  });

  describe('istanbul() with custom instrumentor', function() {
    beforeEach(function () {
      this.stream = istanbul({
        instrumentor: isparta.Instrumentor
      });
    });

    it('instrument files', function (done) {
      this.stream.on('data', function (file) {
        assert.equal(file.path, libFile.path);
        assert(file.contents.toString().indexOf('__cov_') >= 0);
        assert(file.contents.toString().indexOf('$$cov_') >= 0);
        done();
      });

      this.stream.write(libFile);
      this.stream.end();
    });
  });

  describe('.hookRequire()', function () {
    it('clear covered files from require.cache', function (done) {
      var add1 = require('./fixtures/lib/add');
      var stream = istanbul()
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
          var add2 = require('./fixtures/lib/add');
          assert.notEqual(add1, add2);
          done();
        });
      stream.write(libFile);
      stream.end();
    });
  });

  describe('istanbul.summarizeCoverage()', function () {

    it('gets statistics about the test run', function (done) {
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
          process.stdout.write = function () {};
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha())
            .on('end', function () {
              var data = istanbul.summarizeCoverage();
              process.stdout.write = out;
              assert.equal(data.lines.pct, 75);
              assert.equal(data.statements.pct, 75);
              assert.equal(data.functions.pct, 50);
              assert.equal(data.branches.pct, 100);
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
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
          process.stdout.write = function () {};
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha())
            .on('end', function () {
              var data = istanbul.summarizeCoverage({
                  coverageVariable: COV_VAR
              });
              process.stdout.write = out;

              // If untested files are included, line and statement coverage
              // drops to 25%
              assert.equal(data.lines.pct, 37.5);
              assert.equal(data.statements.pct, 37.5);
              assert.equal(data.functions.pct, 25);
              assert.equal(data.branches.pct, 100);
              done();
            });
        });
    });
  });

  describe('istanbul.writeReports()', function () {
    beforeEach(function (done) {
      // set up coverage
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', done);
    });

    afterEach(function () {
      rimraf.sync('coverage');
      rimraf.sync('cov-foo');
    });

    it('output coverage report', function (done) {
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
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
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', function () {
          process.stdout.write = out;
          assert(fs.existsSync('./coverage'));
          assert(fs.existsSync('./coverage/lcov.info'));
          assert(fs.existsSync('./coverage/coverage-final.json'));
          done();
        });
    });

    it('allow specifying report output dir (legacy way)', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.writeReports('cov-foo'))
        .on('end', function () {
          process.stdout.write = out;
          assert(fs.existsSync('./cov-foo'));
          assert(fs.existsSync('./cov-foo/lcov.info'));
          assert(fs.existsSync('./cov-foo/coverage-final.json'));
          done();
        });
    });

    it('allow specifying report output dir', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.writeReports({ dir: 'cov-foo' }))
        .on('end', function () {
          process.stdout.write = out;
          assert(fs.existsSync('./cov-foo'));
          assert(fs.existsSync('./cov-foo/lcov.info'));
          assert(fs.existsSync('./cov-foo/coverage-final.json'));
          process.stdout.write = out;
          done();
        });
    });

    it('allow specifying report output formats', function (done) {
      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.writeReports({ dir: 'cov-foo', reporters: ['cobertura'] }))
        .on('end', function () {
          process.stdout.write = out;
          assert(fs.existsSync('./cov-foo'));
          assert(!fs.existsSync('./cov-foo/lcov.info'));
          assert(fs.existsSync('./cov-foo/cobertura-coverage.xml'));
          process.stdout.write = out;
          done();
        });
    });

    it('allow specifying configuration per report', function (done) {
      process.stdout.write = function () {};
      var opts = {
        reporters: ['lcovonly', 'json'],
        reportOpts: {
          lcovonly: { dir: 'lcovonly', file: 'lcov-test.info' },
          json: { dir: 'json', file: 'json-test.info' }
        }
      };

      gulp.src(['test/fixtures/test/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports(opts))
        .on('end', function() {
          process.stdout.write = out;
          assert(fs.existsSync('./lcovonly'));
          assert(fs.existsSync('./lcovonly/lcov-test.info'));
          assert(fs.existsSync('./json'));
          assert(fs.existsSync('./json/json-test.info'));
          process.stdout.write = out;
          done();
        });
    });

    it('allows specifying custom reporters', function (done) {
      var ExampleReport = function() {};
      ExampleReport.TYPE = 'example';
      ExampleReport.prototype = Object.create(Report.prototype);

      var reported = false;
      ExampleReport.prototype.writeReport = function () {
        reported = true;
        this.emit('done');
      };

      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.writeReports({ dir: 'cov-foo', reporters: [ExampleReport] }))
        .on('end', function () {
          process.stdout.write = out;
          assert(reported);
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
      assert.equal(actualErr.plugin, 'gulp-babel-istanbul');
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
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha())
            .pipe(istanbul.writeReports({ coverageVariable: coverageVariable }))
            .on('end', function () {
              assert(fs.existsSync('./coverage'));
              assert(fs.existsSync('./coverage/lcov.info'));
              assert(fs.existsSync('./coverage/coverage-final.json'));
              process.stdout.write = out;
              done();
            });
        });
    });
  });

  describe('istanbul.enforceThresholds()', function () {
    beforeEach(function (done) {
      // set up coverage
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', done);
    });

    afterEach(function () {
      rimraf.sync('coverage');
      rimraf.sync('cov-foo');
    });

    it('checks coverage fails against global threshold', function (done) {
      var resolved = false;

      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 }}))
        .on('error', function (err) {
          if (!resolved) {
            resolved = true;
            process.stdout.write = out;
            assert.equal(err.message, 'Coverage failed');
            done();
          }
        })
        .on('end', function () {
          if (!resolved) {
            resolved = true;
            process.stdout.write = out;
            done(new Error('enforceThresholds did not raise an error'));
          }
        });
    });

    it('checks coverage fails against per file threshold', function (done) {
      var resolved = false;

      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.enforceThresholds({ thresholds: { each: 80 }}))
        .on('error', function (err) {
          if (!resolved) {
            resolved = true;
            process.stdout.write = out;
            assert.equal(err.message, 'Coverage failed');
            done();
          }
        })
        .on('end', function () {
          if (!resolved) {
            resolved = true;
            process.stdout.write = out;
            done(new Error('enforceThresholds did not raise an error'));
          }
        });
    });

    it('checks coverage passes against global and per file thresholds', function (done) {
      var resolved = false;

      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/test/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 50, each: 45 }}))
        .on('error', function () {
          if (!resolved) {
            resolved = true;
            process.stdout.write = out;
            done(new Error('enforceThresholds did not raise an error'));
          }
        })
        .on('end', function () {
          if (!resolved) {
            resolved = true;
            process.stdout.write = out;
            done();
          }
        });
    });

    it('checks coverage with a custom coverage variable', function (done) {
      var resolved = false;
      var coverageVariable = 'CUSTOM_COVERAGE_VARIABLE';

      process.stdout.write = function () {};
      gulp.src([ 'test/fixtures/lib/*.js' ])
        .pipe(istanbul({ coverageVariable: coverageVariable }))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
          gulp.src([ 'test/fixtures/test/*.js' ])
            .pipe(mocha())
            .pipe(istanbul.enforceThresholds({
              coverageVariable: coverageVariable,
              thresholds: { global: 100 }
            }))
            .on('error', function (err) {
              if (!resolved) {
                resolved = true;
                process.stdout.write = out;
                assert.equal(err.message, 'Coverage failed');
                done();
              }
            })
            .on('end', function () {
              if (!resolved) {
                resolved = true;
                process.stdout.write = out;
                done(new Error('enforceThresholds did not raise an error'));
              }
            });
        });
    });
  });
});
