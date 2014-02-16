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
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha'); // Using mocha here, but any test framework will work

gulp.task('test', function (cb) {
  gulp.src(['lib/**/*.js', 'main.js'])
    .pipe(istanbul()) // Covering files
    .on('end', function () {
      gulp.src(['test/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb);
    });
});
```

API
--------------

### istanbul()

Instrument files passes to the stream

### istanbul.writeReports(dir)

Create the reports (LCOV, json and visual output) once stream end.

#### dir
Type: `String`  
Default: `./coverage`

The folder in which the reports are to be outputted.

License
------------

[MIT License](http://en.wikipedia.org/wiki/MIT_License) (c) Simon Boudrias - 2013

[npm-url]: https://npmjs.org/package/gulp-istanbul
[npm-image]: https://badge.fury.io/js/gulp-istanbul.png

[travis-url]: http://travis-ci.org/SBoudrias/gulp-istanbul
[travis-image]: https://secure.travis-ci.org/SBoudrias/gulp-istanbul.png?branch=master

[depstat-url]: https://david-dm.org/SBoudrias/gulp-istanbul
[depstat-image]: https://david-dm.org/SBoudrias/gulp-istanbul.png
