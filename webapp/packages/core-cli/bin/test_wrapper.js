#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';
const { spawn } = require('node:child_process');

const ls = spawn(
  'cmd',
  ['/c', 'yarn', 'run', 'core-cli-test-wrapped', ...process.argv.slice(2, process.argv.length)],
  {
    // cwd: __dirname,
    env: {
      ...process.env,
      // NODE_OPTIONS: "-r esm"
    },
    stdio: 'inherit',
  }
);
