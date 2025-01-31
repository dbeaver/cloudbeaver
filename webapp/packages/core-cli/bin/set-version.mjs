#!/usr/bin/env node

process.title = 'core-set-version';

import fs from 'node:fs/promises';
import path from 'path';

const version = process.argv[2];
const packageJsonPath = path.join(process.cwd(), 'package.json');

await fs.writeFile(
  packageJsonPath,
  await fs.readFile(packageJsonPath, 'utf8')
    .then((content) => content.replace(/"version": ".*"/, `"version": "${version}"`)),
  'utf8',
);

