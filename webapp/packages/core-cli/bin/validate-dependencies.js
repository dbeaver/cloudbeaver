#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';
process.title = 'core-filter-deps';

const glob = require('glob');
const fs = require('fs');
const path = require('path');

// Resolve current root
const currentPackageRoot = path.resolve('.');

// Replace with the correct path to the `package.json` file
const currentPackagePath = path.join(currentPackageRoot, 'package.json');

// Replace with the correct path to the `src` directory
const currentPackageSrcPath = path.join(currentPackageRoot, 'src');

// Read the contents of the `package.json` file
const currentPackage = JSON.parse(fs.readFileSync(currentPackagePath, 'utf8'));

// Keep track of the dependencies that were found in the source files
const dependencies = new Set();
const devDependencies = new Set();

const sourceFilesIterator = glob.globIterateSync('**/*.{ts,tsx,scss,css}', { cwd: currentPackageSrcPath });
const importRegex = /(import|export) ((type |)([\w,\s]*?)(\{[\w\s\n,]*?\}|) from |)['"]((@[\w-]*\/[\w-]*)|([^\\.].*?))(\/.*)*['"]/g;
const testFileRegex = /((__custom_mocks__|__tests__).*|\.test)\.tsx?$/i;
const tsFileRegex = /\.ts$/i;
const tsxFileRegex = /\.tsx$/i;
const styleFileRegex = /\.s?css$/i;
const cssModuleFileRegex = /\.(m|module)\.s?css$/i;

for (const file of sourceFilesIterator) {
  const isCSSModuleFileRegex = cssModuleFileRegex.test(file);
  const isTSFileRegex = tsFileRegex.test(file);
  const isStyleFileRegex = styleFileRegex.test(file);
  const isTSXFileRegex = tsxFileRegex.test(file);
  const isTestFile = testFileRegex.test(file);

  if (isTSFileRegex) {
    devDependencies.add('typescript');
  }

  if (isCSSModuleFileRegex) {
    devDependencies.add('typescript-plugin-css-modules');
  }

  if (isTestFile) {
    devDependencies.add('@types/jest');
  }

  if (isTSXFileRegex) {
    if (isTestFile) {
      devDependencies.add('react');
    } else {
      dependencies.add('react');
    }
    devDependencies.add('@types/react');
  }

  const fileContent = fs.readFileSync(path.join(currentPackageSrcPath, file), 'utf8');
  const matches = fileContent.matchAll(importRegex);
  for (const match of matches) {
    const dep = match[6];

    if (isStyleFileRegex || isTestFile) {
      devDependencies.add(dep);
      continue;
    }

    dependencies.add(dep);
  }
}

currentPackage.sideEffects = currentPackage.sideEffects || [];

const sideEffects = ['src/**/*.css', 'src/**/*.scss', 'public/**/*'];

for (const sideEffect of sideEffects) {
  if (!currentPackage.sideEffects.includes(sideEffect)) {
    currentPackage.sideEffects.push(sideEffect);
  }
}

const newDependencies = [...dependencies].sort(sortDependencies);

logUnmetAndExtraDependencies('dependencies', newDependencies, currentPackage.dependencies);

currentPackage.dependencies = newDependencies.reduce(
  (acc, dep) => ({
    ...acc,
    [dep]: getVersion(dep, acc?.[dep]),
  }),
  currentPackage.dependencies,
);

const newDevDependencies = [...devDependencies].sort(sortDependencies);

logUnmetAndExtraDependencies('dev dependencies', newDevDependencies, currentPackage.devDependencies);

currentPackage.devDependencies = [...devDependencies].sort(sortDependencies).reduce(
  (acc, dep) => ({
    ...acc,
    [dep]: getVersion(dep, acc?.[dep]),
  }),
  currentPackage.devDependencies,
);

// Write the updated `package.json`
fs.writeFileSync(currentPackagePath, JSON.stringify(currentPackage, null, 2) + '\n', 'utf8');

function getVersion(dependency, current) {
  if (dependency.startsWith('@cloudbeaver')) {
    return '~0.1.0';
  }

  if (current) {
    return current;
  }

  try {
    if (fs.existsSync(path.join(require.resolve(dependency), 'package.json')) === false) {
      console.error(`Dependency ${dependency} not found`);
      return '*';
    }
  } catch {
    try {
      if (fs.existsSync(path.join('@types', require.resolve(dependency), 'package.json')) === false) {
        console.error(`Dependency ${dependency} not found`);
        return '*';
      } else {
        return '^' + require(path.join('@types', require.resolve(dependency), 'package.json')).version;
      }
    } catch {
      console.error(`Dependency ${dependency} not found`);
      return '*';
    }
  }

  return '^' + require(path.join(dependency, 'package.json')).version;
}

function sortDependencies(a, b) {
  return a.localeCompare(b);
}

function logUnmetAndExtraDependencies(key, newDependencies, current) {
  const unmetDependencies = newDependencies.filter(dep => !current?.[dep]);
  const extraDependencies = Object.keys(current || {}).filter(dep => !newDependencies.includes(dep));

  if (unmetDependencies.length > 0) {
    console.warn(`Unmet ${key} found:`, unmetDependencies);
  }

  if (extraDependencies.length > 0) {
    console.warn(`Extra ${key} found:`, extraDependencies);
  }
}
