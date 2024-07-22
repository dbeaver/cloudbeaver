/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const { printMessage } = require('./printMessage');

function validateDependencies(currentPackageRoot) {
  const currentPackagePath = path.join(currentPackageRoot, 'package.json');
  const currentPackageSrcPath = path.join(currentPackageRoot, 'src');
  const currentPackage = JSON.parse(fs.readFileSync(currentPackagePath, 'utf8'));

  const dependencies = new Set();
  const devDependencies = new Set();
  let isSuccess = true;

  const sourceFilesIterator = glob.globIterateSync('**/*.{ts,tsx,scss,css}', { cwd: currentPackageSrcPath });
  const importRegex = /(import|export) ((type |)([\w,\s*]*?)(\{[\w\s\n,]*?\}|) from |)['"]((@[\w-]*\/[\w-]*)|([^\\.].*?))(\/.*)*['"]/g;
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

  printMessage('Analyzing dependencies...', true);
  let isNeedToReplace = true;
  let isPackageJsonPathPrinted = false;

  function log(type, message, ...args) {
    if (type !== 'success' && !isPackageJsonPathPrinted) {
      isPackageJsonPathPrinted = true;
      log('info', 'Package: ' + currentPackagePath);
    }

    let color = '\x1b[34m%s\x1b[0m';
    if (type === 'warn') {
      color = '\x1b[33m%s\x1b[0m';
    } else if (type === 'error') {
      color = '\x1b[31m%s\x1b[0m';
    } else if (type === 'success') {
      color = '\x1b[32m%s\x1b[0m';
    }

    printMessage(color, isNeedToReplace, message, ...args);
    if (isNeedToReplace) {
      printMessage('', false);
      isNeedToReplace = false;
    }
  }

  const newDependencies = [...dependencies].sort(sortDependencies);
  const newAllDependencies = [...newDependencies, ...devDependencies].sort(sortDependencies);

  logUnmetAndExtraDependencies('dependencies', newDependencies, currentPackage.dependencies, newAllDependencies);

  currentPackage.dependencies = sortObjectKeys(
    newDependencies.reduce(
      (acc, dep) => ({
        ...acc,
        [dep]: getVersion(dep, acc?.[dep]),
      }),
      currentPackage.dependencies,
    ),
  );

  const newDevDependencies = [...devDependencies].sort(sortDependencies);

  logUnmetAndExtraDependencies('dev dependencies', newDevDependencies, currentPackage.devDependencies, newAllDependencies);

  currentPackage.devDependencies = sortObjectKeys(
    [...devDependencies].sort(sortDependencies).reduce(
      (acc, dep) => ({
        ...acc,
        [dep]: getVersion(dep, acc?.[dep]),
      }),
      currentPackage.devDependencies,
    ),
  );

  if (isSuccess) {
    log('success', 'All dependencies are valid');
  }

  // Write the updated `package.json`
  fs.writeFileSync(currentPackagePath, JSON.stringify(currentPackage, null, 2) + '\n', 'utf8');

  function getVersion(dependency, current) {
    if (dependency.startsWith('@cloudbeaver')) {
      return '^0';
    }

    if (current) {
      return current;
    }

    try {
      if (fs.existsSync(path.join(require.resolve(dependency), 'package.json')) === false) {
        log('error', `Dependency ${dependency} not found`);
        return '*';
      }
    } catch {
      try {
        if (fs.existsSync(path.join('@types', require.resolve(dependency), 'package.json')) === false) {
          log('error', `Dependency ${dependency} not found`);
          return '*';
        } else {
          return '^' + require(path.join('@types', require.resolve(dependency), 'package.json')).version;
        }
      } catch {
        log('error', `Dependency ${dependency} not found`);
        return '*';
      }
    }

    return '^' + require(path.join(dependency, 'package.json')).version;
  }

  function sortDependencies(a, b) {
    return a.localeCompare(b);
  }

  function logUnmetAndExtraDependencies(key, newDependencies, current, allDependencies = []) {
    const unmetDependencies = newDependencies.filter(dep => !current?.[dep]);
    const extraDependencies = Object.keys(current || {}).filter(dep => {
      if (newDependencies.includes(dep)) {
        return false;
      }

      if (dep.startsWith('@types/') && allDependencies.includes(dep.replace('@types/', ''))) {
        return false;
      }

      return true;
    });

    if (unmetDependencies.length > 0) {
      log('warn', `Unmet ${key} added:`, unmetDependencies);
      isSuccess = false;
    }

    if (extraDependencies.length > 0) {
      log('error', `Extra ${key} found:`, extraDependencies);
      isSuccess = false;
    }
  }

  function sortObjectKeys(object) {
    return Object.keys(object)
      .sort()
      .reduce((obj, key) => {
        obj[key] = object[key];
        return obj;
      }, {});
  }

  return isSuccess;
}

module.exports = {
  validateDependencies,
};
