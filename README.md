# gulp-istanbul [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

> istanbul plugin for [gulp](https://github.com/wearefractal/gulp)

## Usage

First, install `gulp-istanbul` as a development dependency:

```shell
npm install --save-dev gulp-istanbul
```

Then, add it to your `gulpfile.js`:

```javascript
var istanbul = require("gulp-istanbul");

gulp.src("lib/**/*.js")
  .pipe(istanbul());
```

## API

### istanbul(options)

#### options.msg
Type: `String`  
Default: `Hello World`

The message you wish to attach to file.


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/gulp-istanbul
[npm-image]: https://badge.fury.io/js/gulp-istanbul.png

[travis-url]: http://travis-ci.org/SBoudrias/gulp-istanbul
[travis-image]: https://secure.travis-ci.org/SBoudrias/gulp-istanbul.png?branch=master

[depstat-url]: https://david-dm.org/SBoudrias/gulp-istanbul
[depstat-image]: https://david-dm.org/SBoudrias/gulp-istanbul.png
