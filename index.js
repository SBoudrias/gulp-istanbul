"use strict";
var COVERAGE_VARIABLE = '$$cov_' + new Date().getTime() + '$$';

var through = require('through2').obj;
var path = require("path");
var istanbul = require("istanbul");
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;


var plugin  = module.exports = function (opts) {
  if (!opts) opts = {};
  if (!opts.coverageVariable) opts.coverageVariable = COVERAGE_VARIABLE;
  var fileMap = {};

  hook.hookRequire(function (path) {
    return !!fileMap[path];
  }, function (code, path) {
    return fileMap[path];
  });

  var instrumenter = new istanbul.Instrumenter({ coverageVariable: opts.coverageVariable });

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

plugin.writeReports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts };
  if (!opts) opts = {};
  if (!opts.coverageVariable) opts.coverageVariable = COVERAGE_VARIABLE;
  if (!opts.dir) opts.dir = path.join(process.cwd(), "coverage");

  var cover = through();

  cover.on('end', function() {

    var collector = new Collector();

    collector.add(global[opts.coverageVariable]);


    var reports = [
        Report.create("lcov", { dir: opts.dir }),
        Report.create("json", { dir: opts.dir }),
        Report.create("text"),
        Report.create("text-summary")
    ];
    reports.forEach(function (report) { report.writeReport(collector, true); });

    delete global[opts.coverageVariable];

  }).resume();

  return cover;

};
