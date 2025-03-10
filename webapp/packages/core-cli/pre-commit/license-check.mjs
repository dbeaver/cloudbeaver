import { exec, execSync } from 'child_process';
import fs from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';
import yaml from 'js-yaml';

const configurationPath = resolve(process.cwd(), 'webapp/licensifyrc.yml');

const content = fs.readFileSync(configurationPath, 'utf8');
const config = yaml.load(content);
const template = config.text;
const extensions = new Set();
const currentYear = new Date().getFullYear();
const license = template.replace('${currentYear}', String(currentYear)).trim().split('\n');

extensions.add('.ts');
extensions.add('.tsx');

const output = exec('git diff --cached --name-only --diff-filter=ACMR -- webapp/**/*');
const rl = createInterface(output.stdout);
const invalidFiles = [];

for await (const line of rl) {
  const extension = line.slice(line.lastIndexOf('.'));
  if (extensions.has(extension)) {
    const fileRl = createInterface(fs.createReadStream(line));

    let fileLineIndex = 0;
    for await (const fileLine of fileRl) {
      if (fileLine.startsWith('#!/usr/bin/env')) {
        continue;
      }
      if (fileLine !== license[fileLineIndex]) {
        invalidFiles.push(line);
        break;
      }
      fileLineIndex++;
      if (fileLineIndex === license.length) {
        break;
      }
    }
  }
}

if (invalidFiles.length > 0) {
  execSync('git restore --staged ' + invalidFiles.join(' '));
  process.stdout.write('Found files without license header. Please add license to all unstaged files.');
  process.exit(1);
}
