'use strict';

var fs = require('fs'),
  vm = require('vm'),
  vmInclude = function(code, path) {
    vm.runInThisContext(code, path);
  },
  vmAddFile = function(path) {
    vmInclude(fs.readFileSync(path), path);
  };

vmAddFile(__dirname+'/../lib/global-vm-add.js');
