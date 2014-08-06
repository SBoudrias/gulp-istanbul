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
  if (!opts.coverageVariable) opts.coverageVariable = COVERAGE_VARIABLE;
  var fileMap = {};

  hook.hookRequire(function (path) {
    return !!fileMap[path];
  }, function (code, path) {
    return fileMap[path];
  });

  var instrumenter = new istanbul.Instrumenter(opts);

  return through(function (file, enc, cb) {
    if (!file.contents instanceof Buffer) {
      return cb(new PluginError(PLUGIN_NAME, 'streams not supported'), undefined);
    }

    instrumenter.instrument(file.contents.toString(), file.path, function (err, code) {
      if (!err) file.contents = new Buffer(code);

      fileMap[file.path] = file.contents.toString();

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
    return Report.create(r, opts.reportOpts);
  });

  var cover = through();

  cover.on('end', function () {
    var collector = new Collector();
    collector.add(global[opts.coverageVariable] || {}); //revert to an object if there are not macthing source files.
    reporters.forEach(function (report) { report.writeReport(collector, true); });
    delete global[opts.coverageVariable];
  }).resume();

  return cover;
};
