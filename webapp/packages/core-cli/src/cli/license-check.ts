#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/// <reference types="node" />
process.title = 'core-check-license';

import { execSync } from 'child_process';
import fs from 'fs';
import path, { resolve } from 'path';
import { createInterface } from 'readline';
import yaml from 'js-yaml';

interface IConfig {
  text: string;
}

const base = path.basename(process.cwd());

const staged = execSync('git diff --cached --name-only --diff-filter=ACMR')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean)
  .map(file => {
    if (file.startsWith(base + path.sep)) {
      return file.slice(base.length + 1);
    }

    return file;
  });

const configurationPath = resolve(process.cwd(), 'licensifyrc.yml');
const content = fs.readFileSync(configurationPath, 'utf8');
const config = yaml.load(content) as IConfig;
const template = config.text;
const currentYear = new Date().getFullYear();
const license = template.replace('${currentYear}', String(currentYear)).trim().split('\n');

const invalidFiles: string[] = [];

for (const file of staged) {
  const stream = fs.createReadStream(path.resolve(file), 'utf8');
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let index = 0;
  for await (const line of rl) {
    if (line.startsWith('#!/usr/bin/env')) {
      continue;
    }

    if (line !== license[index]) {
      invalidFiles.push(file);
      break;
    }

    index++;

    if (index === license.length) {
      break;
    }
  }
}

if (invalidFiles.length > 0) {
  execSync('git restore --staged ' + invalidFiles.join(' '));
  process.stdout.write('Please add license header to the following files:\n');
  for (const file of invalidFiles) {
    process.stdout.write(`  - ${file}\n`);
  }
  process.exit(1);
} else {
  process.stdout.write('All files have valid license headers.\n');
  process.exit(0);
}
