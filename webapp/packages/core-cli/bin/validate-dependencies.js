#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';
process.title = 'core-filter-deps';

const fs = require('fs');
const path = require('path');

// Resolve current root
const root = path.resolve('.');

// Replace with the correct path to the `package.json` file
const packageJsonPath = path.join(root, 'package.json');

// Replace with the correct path to the `src` directory
const srcDir = path.join(root, 'src');

// Read the contents of the `package.json` file
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Keep track of the dependencies that were found in the .ts files
const cloudbeaverDependencies = new Set();
const cloudbeaverDevDependencies = new Set();

// A helper function that recursively processes a directory and its subdirectories
function processDirectory(directory) {
  // Iterate over all files in the directory
  fs.readdirSync(directory).forEach(file => {
    // Check if the file is a directory
    const filePath = path.join(directory, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      // If it is, recursively process the subdirectory
      processDirectory(filePath);
    } else {
      // Otherwise, check if the file is a .ts/.tsx file
      const extensions = /(?<!\.test).tsx?$/i;
      if (extensions.test(file)) {
        // Read the contents of the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const regex = /import\s+(type\s+|)(\{[^}]*\}|\w+)\s+from\s+['"]@cloudbeaver\/([^/'"]*)(\/[^'"]*)?['"]/g;

        // Find all imports that start with `@cloudbeaver`
        const matches = fileContent.match(regex);

        // Add the found dependencies to the set
        if (matches) {
          matches.forEach(match => {
            const dep = match.split('/')[1].replace(/['"]/g, '');
            const fullDep = `@cloudbeaver/${dep}`;

            cloudbeaverDependencies.add(fullDep);
          });
        }
      } else if (/\.test.tsx?$/i.test(file)) {
        //@cloudbeaver/tests-runner
        // Read the contents of the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const regex = /import\s+(type\s+|)(\{[^}]*\}|\w+)\s+from\s+['"]@cloudbeaver\/tests-runner(\/[^'"]*)?['"]/g;
        const matches = fileContent.match(regex);
        if (matches?.length) {
          cloudbeaverDevDependencies.add('@cloudbeaver/tests-runner');
        }
      }
    }
  });
}

// Start processing the `src` directory
processDirectory(srcDir);

packageJson.sideEffects = packageJson.sideEffects || [];

const sideEffects = ['src/**/*.css', 'src/**/*.scss', 'public/**/*'];

for (const sideEffect of sideEffects) {
  if (!packageJson.sideEffects.includes(sideEffect)) {
    packageJson.sideEffects.push(sideEffect);
  }
}

packageJson.peerDependencies = packageJson.peerDependencies || {};

const isProduct = /^@cloudbeaver\/product-.+$/.test(packageJson.name) || true;

const dependenciesToRemove = isProduct ? packageJson.peerDependencies : packageJson.dependencies;
const dependenciesToAdd = isProduct ? packageJson.dependencies : packageJson.peerDependencies;

for (const dep in dependenciesToRemove) {
  if (dep.includes('@cloudbeaver')) {
    delete dependenciesToRemove[dep];
  }
}

// Iterate over the dependencies in the `package.json` file
for (const dep in dependenciesToAdd) {
  // If a dependency was not found in any of the .ts/.tsx files, delete it from the `package.json` file
  // Make sure we are deleting only internal dependencies
  if (dep.includes('@cloudbeaver') && !cloudbeaverDependencies.has(dep)) {
    delete dependenciesToAdd[dep];
  }
}

// Plugins first, core packages after
const sortedDependencies = [...cloudbeaverDependencies.values()].sort((a, b) => {
  const aPlugin = a.includes('plugin-');
  const bPlugin = b.includes('plugin-');

  if (aPlugin && bPlugin) {
    return a.localeCompare(b);
  }

  if (aPlugin && !bPlugin) {
    return -1;
  }

  if (!aPlugin && bPlugin) {
    return 1;
  }

  return a.localeCompare(b);
});

// Add the dependencies that were found in the .ts/.tsx files to the `package.json` file
sortedDependencies.forEach(dep => {
  if (!dependenciesToAdd[dep]) {
    dependenciesToAdd[dep] = '~0.1.0';
  }
});

packageJson.devDependencies = packageJson.devDependencies || {};
const devDependencies = packageJson.devDependencies;

const sortedDevDependencies = [...cloudbeaverDevDependencies.values()].sort((a, b) => a.localeCompare(b));

for (const dep of sortedDevDependencies) {
  if (!devDependencies[dep]) {
    devDependencies[dep] = '~0.1.0';
  }
}

// Write the updated `package.json`
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
