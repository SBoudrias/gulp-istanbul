'use strict';

var through = require('through2').obj;
var path = require('path');
var istanbul = require('istanbul');
var gutil = require('gulp-util');
var _ = require('lodash');
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-istanbul';
var COVERAGE_VARIABLE = '$$cov_' + new Date().getTime() + '$$';

var plugin  = module.exports = function (opts) {
  opts = opts || {};
  opts.includeUntested = opts.includeUntested === true;
  if (!opts.coverageVariable) opts.coverageVariable = COVERAGE_VARIABLE;
  var fileMap = {};

  hook.hookRequire(function (path) {
    return !!fileMap[path];
  }, function (code, path) {
    return fileMap[path];
  });

  var instrumenter = new istanbul.Instrumenter(opts);

  return through(function (file, enc, cb) {
    if (!(file.contents instanceof Buffer)) {
      return cb(new PluginError(PLUGIN_NAME, 'streams not supported'), undefined);
    }

    instrumenter.instrument(file.contents.toString(), file.path, function (err, code) {
      if (!err) file.contents = new Buffer(code);

      fileMap[file.path] = file.contents.toString();

      // Parse the blank coverage object from the instrumented file and save it
      // to the global coverage variable to enable reporting on non-required
      // files, a workaround for
      // https://github.com/gotwarlost/istanbul/issues/112
      if (opts.includeUntested) {
        var instrumentedSrc = fileMap[file.path];
        var covStubRE = /\{.*"path".*"fnMap".*"statementMap".*"branchMap".*\}/g;
        var covStubMatch = covStubRE.exec(instrumentedSrc);
        if (covStubMatch !== null) {
          var covStub = JSON.parse(covStubMatch[0]);
          global[opts.coverageVariable] = global[opts.coverageVariable] || {};
          global[opts.coverageVariable][path.resolve(file.path)] = covStub;
        }
      }

      return cb(err, file);
    });
  });
};

plugin.summarizeCoverage = function (opts) {
  opts = opts || {};
  if (!opts.coverageVariable) opts.coverageVariable = COVERAGE_VARIABLE;

  if (!global[opts.coverageVariable]) throw new Error('no coverage data found, run tests before calling `summarizeCoverage`');

  var collector = new Collector();
  collector.add(global[opts.coverageVariable]);
  return istanbul.utils.summarizeCoverage(collector.getFinalCoverage());
};

plugin.writeReports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts };
  opts = opts || {};

  var defaultDir = path.join(process.cwd(), 'coverage');
  opts = _.defaults(opts, {
    coverageVariable: COVERAGE_VARIABLE,
    dir: defaultDir,
    reporters: [ 'lcov', 'json', 'text', 'text-summary' ],
    reportOpts: { dir: opts.dir || defaultDir }
  });

  var invalid = _.difference(opts.reporters, Report.getReportList());
  if (invalid.length) {
    // throw before we start -- fail fast
    throw new PluginError(PLUGIN_NAME, 'Invalid reporters: ' + invalid.join(', '));
  }

  var reporters = opts.reporters.map(function (r) {
    return Report.create(r, _.clone(opts.reportOpts));
  });

  var cover = through();

  cover.on('end', function () {
    var collector = new Collector();

    // revert to an object if there are not macthing source files.
    collector.add(global[opts.coverageVariable] || {});

    reporters.forEach(function (report) {
      report.writeReport(collector, true);
    });
  }).resume();

  return cover;
};
