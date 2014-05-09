"use strict";
var COVERAGE_VARIABLE = '$$cov_' + new Date().getTime() + '$$';

var through = require('through2').obj;
var path = require("path");
var istanbul = require("istanbul");
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;
var instrumenter = new istanbul.Instrumenter({ coverageVariable:COVERAGE_VARIABLE });

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

plugin.writeReports = function (opts) {
  if (arguments.length === 1 && typeof(arguments[0]) === 'string' ) {
    opts = { dir: opts };
  } else if (!opts) {
    opts = {};
  }
  if (!opts.dir) {
    opts.dir = path.join(process.cwd(), "coverage"); 
  }
  if (!opts.reporters) { 
    opts.reporters = [ "lcov", "json", "text", "text-summary" ]; 
  }
  if (!opts.reportOpts) {
    opts.reportOpts = { dir: opts.dir };
  }

  var cover = through();

  cover.on('end', function() {

    var collector = new Collector();

    collector.add(global[COVERAGE_VARIABLE]);


    opts.reporters.forEach(function (type) { 
      var report = Report.create(type, opts.reportOpts)
      report.writeReport(collector, true); 
    });

    delete global[COVERAGE_VARIABLE];

  }).resume();

  return cover;

};
