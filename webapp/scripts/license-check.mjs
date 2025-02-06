import { exec, execSync } from 'child_process';
import fs from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';

const snippetPath = resolve(process.argv[2]);
const snippetName = process.argv[3];
const snippets = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
const licenseSnippet = snippets[snippetName];

const scopes = licenseSnippet.scope.split(',');
const license = licenseSnippet.body;
const extensions = new Set();

for (const scope of scopes) {
  switch (scope.trim()) {
    case 'typescript':
      extensions.add('.ts');
      break;
    case 'typescriptreact':
      extensions.add('.tsx');
      break;
    case 'javascript':
      extensions.add('.js');
      break;
    case 'javascriptreact':
      extensions.add('.jsx');
      break;
    case 'css':
      extensions.add('.css');
      break;
    case 'scss':
      extensions.add('.scss');
      break;
  }
}

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
