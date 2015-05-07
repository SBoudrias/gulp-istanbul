gulp-istanbul [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]
===========================

[Istanbul][istanbul] unit test coverage plugin for [gulp][gulp].

Works on top of any Node.js unit test framework.

Installation
---------------

```shell
npm install --save-dev gulp-istanbul
```

Example
---------------

In your `gulpfile.js`:

#### Node.js testing

```javascript
var istanbul = require('gulp-istanbul');
// We'll use mocha here, but any test framework will work
var mocha = require('gulp-mocha');

gulp.task('test', function (cb) {
  gulp.src(['lib/**/*.js', 'main.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src(['test/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } })) // Enforce a coverage of at least 90%
        .on('end', cb);
    });
});
```

#### Browser testing

For browser testing, you'll need to write the files covered by istanbul in a directory from where you'll serve these files to the browser running the test. You'll also need a way to extract the value of the [coverage variable](#coveragevariable) after the test have runned in the browser.

Browser testing is hard. If you're not sure what to do, then I suggest you take a look at [Karma test runner](http://karma-runner.github.io) - it has built-in coverage using Istanbul.


```javascript
var istanbul = require('gulp-istanbul');

gulp.task('test', function (cb) {
  gulp.src(['lib/**/*.js', 'main.js'])
  .pipe(istanbul()) // Covering files
  .pipe(gulp.dest('test-tmp/'))
  .on('finish', function () {
    gulp.src(['test/*.html'])
    .pipe(testFramework())
    .pipe(istanbul.writeReports()) // Creating the reports after tests runned
    .on('end', cb);
  });
});
```

API
--------------

### istanbul(opt)

Instrument files passed in the stream.

#### opt
Type: `Object` (optional)
```js
{
  coverageVariable: 'someVariable',
  ...other Instrumeter options...
}
```

##### coverageVariable
Type: `String` (optional)
Default: `'$$cov_' + new Date().getTime() + '$$'`

The global variable istanbul uses to store coverage

See also:
- [istanbul coverageVariable][istanbul-coverage-variable]
- [SanboxedModule][sandboxed-module-coverage-variable]

##### includeUntested
Type: `Boolean` (optional)
Default: `false`

Flag to include test coverage of files that aren't `require`d by any tests

See also:
- [istanbul "0% coverage" issue](https://github.com/gotwarlost/istanbul/issues/112)

##### instrumenter
Type: `Instrumenter` (optional)
Default: `istanbul.Instrumenter`

Custom Instrumenter to be used instead of the default istanbul one.

```js
var isparta = require('isparta');
var istanbul = require('gulp-istanbul');

gulp.src('lib/**.js')
  .pipe(istanbul({
    instrumenter: isparta.Instrumenter
  }));
```

See also:
- [isparta](https://github.com/douglasduteil/isparta)

##### Other Istanbul Instrumenter options

See:
- [istanbul Instrumenter documentation][istanbul-coverage-variable]

### istanbul.hookRequire()

Overwrite `require` so it returns the covered files. The method take an optional [option object](https://gotwarlost.github.io/istanbul/public/apidocs/classes/Hook.html#method_hookRequire).

Always use this option if you're running tests in Node.js

### istanbul.summarizeCoverage(opt)

get coverage summary details

#### opt
Type: `Object` (optional)
```js
{
  coverageVariable: 'someVariable'
}
```
##### coverageVariable
Type: `String` (optional)
Default: `'$$cov_' + new Date().getTime() + '$$'`

The global variable istanbul uses to store coverage

See also:
- [istanbul coverageVariable][istanbul-coverage-variable]
- [SanboxedModule][sandboxed-module-coverage-variable]

#### returns
Type: `Object`
```js
{
  lines: { total: 4, covered: 2, skipped: 0, pct: 50 },
  statements: { total: 4, covered: 2, skipped: 0, pct: 50 },
  functions: { total: 2, covered: 0, skipped: 0, pct: 0 },
  branches: { total: 0, covered: 0, skipped: 0, pct: 100 }
}
```

See also:
- [istanbul utils.summarizeCoverage()][istanbul-summarize-coverage]


### istanbul.writeReports(opt)

Create the reports on stream end.

#### opt
Type: `Object` (optional)
```js
{
  dir: './coverage',
  reporters: [ 'lcov', 'json', 'text', 'text-summary', CustomReport ],
  reportOpts: { dir: './coverage' },
  coverageVariable: 'someVariable'
}
```

##### dir
Type: `String` (optional)
Default: `./coverage`

The folder in which the reports are to be outputted.

##### reporters
Type: `Array` (optional)
Default: `[ 'lcov', 'json', 'text', 'text-summary' ]`

The list of available reporters:
- `clover`
- `cobertura`
- `html`
- `json`
- `lcov`
- `lcovonly`
- `none`
- `teamcity`
- `text`
- `text-summary`

You can also specify one or more custom reporter objects as items in the array. These will be automatically registered with istanbul.

See also `require('istanbul').Report.getReportList()`

##### coverageVariable
Type: `String` (optional)
Default: `'$$cov_' + new Date().getTime() + '$$'`

The global variable istanbul uses to store coverage

See also:
- [istanbul coverageVariable][istanbul-coverage-variable]
- [SanboxedModule][sandboxed-module-coverage-variable]


### istanbul.enforceThresholds(opt)

Checks coverage against minimum acceptable thresholds. Fails the build if any of the thresholds are not met.

#### opt
Type: `Object` (optional)
```js
{
  coverageVariable: 'someVariable',
  thresholds: {
    global: 60,
    each: -10
  }
}
```

##### coverageVariable
Type: `String` (optional)
Default: `'$$cov_' + new Date().getTime() + '$$'`

The global variable istanbul uses to store coverage


##### thresholds
Type: `Object` (required)

Minimum acceptable coverage thresholds. Any coverage values lower than the specified threshold will fail the build.

Each threshold value can be:
- A positive number - used as a percentage
- A negative number - used as the maximum amount of coverage gaps
- A falsey value will skips the coverage

Thresholds can be specified across all files (`global`) or per file (`each`):
```
{
  global: 80,
  each: 60
}
```

You can also specify a value for each metric:
```
{
  global: {
    statements: 80,
    branches: 90,
    lines: 70,
    functions: -10
  }
  each: {
    statements: 100,
    branches: 70,
    lines: -20
  }
}
```

#### emits

A plugin error in the stream if the coverage fails

License
------------

[MIT License](http://en.wikipedia.org/wiki/MIT_License) (c) Simon Boudrias - 2013

[istanbul]: http://gotwarlost.github.io/istanbul/
[gulp]: https://github.com/gulpjs/gulp

[npm-url]: https://npmjs.org/package/gulp-istanbul
[npm-image]: https://badge.fury.io/js/gulp-istanbul.svg

[travis-url]: http://travis-ci.org/SBoudrias/gulp-istanbul
[travis-image]: https://secure.travis-ci.org/SBoudrias/gulp-istanbul.svg?branch=master

[depstat-url]: https://david-dm.org/SBoudrias/gulp-istanbul
[depstat-image]: https://david-dm.org/SBoudrias/gulp-istanbul.svg

[istanbul-coverage-variable]: http://gotwarlost.github.io/istanbul/public/apidocs/classes/Instrumenter.html
[istanbul-summarize-coverage]: http://gotwarlost.github.io/istanbul/public/apidocs/classes/ObjectUtils.html#method_summarizeCoverage
[sandboxed-module-coverage-variable]: https://github.com/felixge/node-sandboxed-module/blob/master/lib/sandboxed_module.js#L240
