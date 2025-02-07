#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { spawn } from 'node:child_process';

spawn('cmd', ['/c', 'yarn', 'run', 'core-cli-test-wrapped', ...process.argv.slice(2, process.argv.length)], {
  // cwd: __dirname,
  env: {
    ...process.env,
    // NODE_OPTIONS: "-r esm"
  },
  stdio: 'inherit',
});
