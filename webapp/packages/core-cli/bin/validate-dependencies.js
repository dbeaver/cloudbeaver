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
process.title = 'core-filter-deps';

const filter = process.argv[2] || '.';

const glob = require('glob');
const { resolve, join } = require('path');
const { validateDependencies } = require('../utils/validateDependencies');

const currentDir = resolve();
const sourceFilesIterator = glob.globIterateSync(filter, { cwd: currentDir });

for (let currentPackageDir of sourceFilesIterator) {
  currentPackageDir = resolve(currentPackageDir);
  const pkg = require(join(currentPackageDir, 'package.json'));
  console.info(`Processing ${pkg['name']}`);
  validateDependencies(currentPackageDir);
}
