"use strict";

var through = require('through2').obj;
var path = require("path");
var istanbul = require("istanbul");
var gutil = require('gulp-util');
var _ = require('lodash');
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;
var instrumenter = new istanbul.Instrumenter();
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-istanbul';


var plugin  = module.exports = function () {
  var fileMap = {};

  hook.hookRequire(function (path) {
    return !!fileMap[path];
  }, function (code, path) {
    return fileMap[path];
  });

  return through(function (file, enc, cb) {
    if (!file.contents instanceof Buffer) {
      return cb(new Error("gulp-istanbul: streams not supported"), undefined);
    }

    instrumenter.instrument(file.contents.toString(), file.path, function (err, code) {
      if (!err) file.contents = new Buffer(code);

      fileMap[file.path] = file.contents.toString();

      return cb(err, file);
    });
  });
};

plugin.writeReports = function (opt) {
  if (typeof opt === "string") {
    opt = {dir: opt};
  } else if (typeof opt !== 'object') {
    opt = {};
  }

  if (!opt.dir) {
    opt.dir = path.join(process.cwd(), "coverage");
  }
  if (!opt.reports || !opt.reports.length) {
    opt.reports = ["lcov", "json", "text", "text-summary"];
  }
  if (!opt.reportOptions) {
    opt.reportOptions = {dir: opt.dir};
  }
  var validReports = Report.getReportList();

  var invalid = _.difference(opt.reports, validReports);
  if (invalid.length) {
    // throw before we start -- fail fast
    throw new PluginError(PLUGIN_NAME, 'Invalid reporters: '+invalid.join(', '));
  }

  opt.reporters = opt.reports.map(function (r) {
    return Report.create(r, opt.reportOptions);
  });

  var cover = through();

  cover.on('end', function() {
    var collector = new Collector();
    collector.add(global.__coverage__);
    opt.reporters.forEach(function (report) { report.writeReport(collector, true); });
  }).resume();

  return cover;
};
