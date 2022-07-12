#!/usr/bin/env node

'use strict';
process.title = 'core-test';

const { resolve } = require('path')
const jest = require('jest');

if (process.env.NODE_ENV == null) {
  process.env.NODE_ENV = 'test';
}

const argv = [
  ...process.argv.slice(2, process.argv.length),
  "--roots",
  resolve('.'),
  "--config",
  require.resolve('../configs/jest.config.js')
]

jest.run(argv)
