#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

process.title = 'core-set-version';

import fs from 'node:fs/promises';
import path from 'path';

const version = process.argv[2];
const packageJsonPath = path.join(process.cwd(), 'package.json');

await fs.writeFile(
  packageJsonPath,
  await fs.readFile(packageJsonPath, 'utf8').then(content => content.replace(/"version": ".*"/, `"version": "${version}"`)),
  'utf8',
);
