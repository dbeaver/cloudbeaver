#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

process.title = 'core-set-version';

import fs from 'node:fs/promises';
import path from 'path';

const version = process.argv[2];
const packageJsonPath = path.join(process.cwd(), 'package.json');

if (!/^\d+\.\d+\.\d+\.\d+$/.test(version ?? '')) {
  throw new Error('Product version must contain exactly four numeric components (A.B.C.D)');
}

const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

if (!packageJson.product || typeof packageJson.product !== 'object' || Array.isArray(packageJson.product)) {
  throw new Error(`Product configuration is missing in ${packageJsonPath}`);
}

packageJson.version = version.split('.').slice(0, 3).join('.');
packageJson.product.version = version;

await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
