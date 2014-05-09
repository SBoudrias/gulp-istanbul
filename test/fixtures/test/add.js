'use strict';

var assert = require('assert');
var mod = require('../lib/add');

describe('#add', function () {
  it('add numbers', function () {
    assert.equal(mod.add(1, 1), 2);
  });
});
