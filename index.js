var es = require("event-stream");
var path = require("path");
"use strict";

var istanbul = require("istanbul");
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;
var instrumenter = new istanbul.Instrumenter();

var plugin  = module.exports = function (param) {

  function createMatcher(path) {
    return function (requestedPath) {
      return path === requestedPath;
    };
  }

  function bypassContent(code) {
    return function() { return String(code); };
  }

  return es.map(function (file, cb) {
    if (!file.contents instanceof Buffer) {
      return cb(new Error("gulp-istanbul: streams not supported"), undefined);
    }

    instrumenter.instrument(String(file.contents), file.path, function(err, code) {
      if (!err) file.contents = new Buffer(code);
      hook.hookRequire(createMatcher(file.path), bypassContent(file.contents));
      cb(err, file);
    });
  });
};

plugin.writeReports = function (dir) {
  dir = dir || path.join(process.cwd(), "coverage");

  var collector = new Collector();
  collector.add(global.__coverage__);

  var reports = [
      Report.create("lcov", { dir: dir }),
      Report.create("text"),
      Report.create("text-summary")
  ];
  reports.forEach(function (report) { report.writeReport(collector, true); })
};
