'use strict';

var assert = require('assert');
var mod = require('../lib/subtract');

describe('#subtract', function () {
  it('subtract numbers', function () {
    assert.equal(mod.subtract(10, 8), 2);
  });
});
