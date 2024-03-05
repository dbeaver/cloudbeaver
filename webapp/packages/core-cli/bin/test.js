#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';
process.title = 'core-test';

const jest = require('jest');

if (process.env.NODE_ENV == null) {
  process.env.NODE_ENV = 'test';
}

const argv = [...process.argv.slice(2, process.argv.length), '--config', require.resolve('../configs/jest.config.js')];

jest.run(argv);
