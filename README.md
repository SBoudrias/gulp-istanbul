gulp-istanbul [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]
===========================

[Istanbul](http://gotwarlost.github.io/istanbul/) unit test coverage plugin for [gulp](https://github.com/wearefractal/gulp).

Works on top of any Node.js unit test framework.

Installation
---------------

```shell
npm install --save-dev gulp-istanbul
```

Example
---------------

Then, add it to your `gulpfile.js`:

```javascript
var istanbul = require("gulp-istanbul");

// Set up the file coverage
gulp.task('cover', function (cb) {
  gulp.src("lib/**/*.js")
    .pipe(istanbul())
    .on('end', cb);
});

// Run tests and output reports
gulp.task('test', function () {
  gulp.run('cover', function () {
    gulp.src('test/*.js')
      .pipe(mocha()) // Run any unit test frameworks here
      .pipe(istanbul.writeReports());
  });
});
```

API
--------------

### istanbul()

Instrument files passes to the stream

### istanbul.writeReports(dir)

Output the reports on stream end

#### dir
Type: `String`  
Default: `./coverage`

The folder in which the LCOV report is outputted.

License
------------

[MIT License](http://en.wikipedia.org/wiki/MIT_License) (c) Simon Boudrias - 2013

[npm-url]: https://npmjs.org/package/gulp-istanbul
[npm-image]: https://badge.fury.io/js/gulp-istanbul.png

[travis-url]: http://travis-ci.org/SBoudrias/gulp-istanbul
[travis-image]: https://secure.travis-ci.org/SBoudrias/gulp-istanbul.png?branch=master

[depstat-url]: https://david-dm.org/SBoudrias/gulp-istanbul
[depstat-image]: https://david-dm.org/SBoudrias/gulp-istanbul.png
