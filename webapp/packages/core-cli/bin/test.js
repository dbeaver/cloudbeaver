#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';
process.title = 'core-test';

return;
const jest = require('jest');

if (process.env.NODE_ENV == null) {
  process.env.NODE_ENV = 'test';
}

const argv = [...process.argv.slice(2, process.argv.length), '--config', require.resolve('../configs/jest.config.js')];

jest.run(argv);
