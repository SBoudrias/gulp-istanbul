"use strict";
var through = require("through2").obj;
var path = require("path");
var istanbul = require("istanbul");
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;
var instrumenter = new istanbul.Instrumenter();


var plugin    = module.exports = function () {
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
            if (!err) {
                file.contents = new Buffer(code);
            }

            fileMap[file.path] = file.contents.toString();

            return cb(err, file);
        });
    });
};

plugin.writeReports = function (dir) {
    dir = dir || path.join(process.cwd(), "coverage");

    var cover = through();

    cover.on("end", function() {

        var collector = new Collector();

        collector.add(global.__coverage__);


        var reports = [
            Report.create("lcov", { dir: dir }),
            Report.create("json", { dir: dir }),
            Report.create("text"),
            Report.create("text-summary")
        ];
        reports.forEach(function (report) { report.writeReport(collector, true); });

    }).resume();

    return cover;

};
