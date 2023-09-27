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
const foundDependencies = new Set();

// A helper function that recursively processes a directory and its subdirectories
function processDirectory(directory) {
  // Iterate over all files in the directory
  fs.readdirSync(directory)
    .forEach(file => {
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
          const regex = /import\s+(\{[^}]*\}|\w+)\s+from\s+['"]@cloudbeaver\/([^/'"]*)(\/[^'"]*)?['"]/g;

          // Find all imports that start with `@cloudbeaver`
          const matches = fileContent.match(regex);

          // Add the found dependencies to the set
          if (matches) {
            matches.forEach(match => {
              const dep = match.split('/')[1].replace(/['"]/g, '');
              const fullDep = `@cloudbeaver/${dep}`;

              foundDependencies.add(fullDep);
            });
          }
        }
      }
    });
}

// Start processing the `src` directory
processDirectory(srcDir);

// Iterate over the dependencies in the `package.json` file
for (const dep in packageJson.dependencies) {

  // If a dependency was not found in any of the .ts/.tsx files, delete it from the `package.json` file
  // Make sure we are deleting only internal dependencies
  if (dep.includes('@cloudbeaver') && !foundDependencies.has(dep)) {
    delete packageJson.dependencies[dep];
  }
}

// Plugins first, core packages after
const sortedDependencies = [...foundDependencies.values()].sort((a, b) => {
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
  if (!packageJson.dependencies[dep]) {
    packageJson.dependencies[dep] = '~0.1.0';
  }
});

// Write the updated `package.json`
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));