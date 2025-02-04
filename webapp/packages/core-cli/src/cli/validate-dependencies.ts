#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/// <reference types="node" />
import { glob } from 'glob';
import { resolve } from 'node:path';
import { validateDependencies } from '../dependency-validator/validateDependencies.js';
import { printMessage } from '../utils/printMessage.js';
process.title = 'core-filter-deps';

const filter = process.argv[2] || '.';
const currentDir = resolve();
const sourceFilesIterator = glob.globIterateSync(filter, { cwd: currentDir });
let isValidationSuccess = true;

for (let currentPackageDir of sourceFilesIterator) {
  currentPackageDir = resolve(currentPackageDir);
  const status = validateDependencies(currentPackageDir);
  if (!status) {
    isValidationSuccess = false;
  }
}
if (isValidationSuccess) {
  printMessage('All dependencies are valid', false);
} else {
  printMessage('Some dependencies are invalid', false);
}
