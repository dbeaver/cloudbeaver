#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
'use strict';
process.title = 'typescript-resolve-references';

const filter = process.argv[2] || '.';

const { validateDependencies } = require('../utils/validateDependencies');
const { printMessage } = require('../utils/printMessage');
const glob = require('glob');
const fs = require('fs');
const { resolve, join } = require('path');
const upath = require('upath');
const { getCloudBeaverDeps } = require('../utils/getCloudBeaverDeps');

const currentDir = resolve();
const sourceFilesIterator = glob.globIterateSync(filter, { cwd: currentDir });

for (let currentPackageDir of sourceFilesIterator) {
  currentPackageDir = resolve(currentPackageDir);
  const packageJsonPath = join(currentPackageDir, 'package.json');
  const tsConfigPath = join(currentPackageDir, 'tsconfig.json');

  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(tsConfigPath)) {
    continue;
  }

  const pkg = require(packageJsonPath);
  console.info(`Processing ${pkg['name']}`);
  validateDependencies(currentPackageDir);

  let isNeedToReplace = true;

  function log(type, message, ...args) {
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

  printMessage('Resolving typescript project references', true);

  // const tsRootPath = resolve('../../');
  // const tsRootConfigPath = resolve(join(tsRootPath, 'tsconfig.json'));
  const typescriptConfig = require(tsConfigPath);
  // const typescriptRootConfig = require(tsRootConfigPath);

  const allDependencies = getCloudBeaverDeps(pkg);
  const dependencies = [...allDependencies.dependencies, ...allDependencies.devDependencies, ...allDependencies.peerDependencies];

  const nodeModules = [join(currentPackageDir, 'node_modules')];

  typescriptConfig.references = [];
  // typescriptRootConfig.references = typescriptRootConfig.references || [];

  for (const dependency of dependencies) {
    if (dependency === pkg.name) {
      log('error', `Self reference detected: ${dependency}`);
      continue;
    }
    try {
      if (!dependency.startsWith('@cloudbeaver')) {
        continue;
      }
      const dependencyPath = join(require.resolve(join(dependency, 'src', 'index.ts'), { paths: nodeModules }), '../../tsconfig.json');
      typescriptConfig.references.push({
        path: upath.relative(currentPackageDir, dependencyPath),
      });

      // const relativePath = relative(tsRootPath, dependencyPath);

      // if (!typescriptRootConfig.references.find(ref => ref.path === relativePath)) {
      //   typescriptRootConfig.references.push({
      //     path: relativePath,
      //   });
      // }
    } catch (e) {
      log('error', `Failed to resolve ${dependency}`);
    }
  }

  typescriptConfig.references = [...new Set(typescriptConfig.references)];
  typescriptConfig.references.sort((a, b) => a.path.localeCompare(b.path));

  typescriptConfig.compilerOptions = {
    rootDir: 'src',
    outDir: 'dist',
    tsBuildInfoFile: 'dist/tsconfig.tsbuildinfo',
  };

  typescriptConfig.include = ['__custom_mocks__/**/*', 'src/**/*', 'src/**/*.json', 'src/**/*.css', 'src/**/*.scss'];

  typescriptConfig.exclude = typescriptConfig.exclude || [];

  const defaultExclude = ['lib/**/*', 'dist/**/*', '**/node_modules'];

  for (const exclude of defaultExclude) {
    if (!typescriptConfig.exclude.includes(exclude)) {
      typescriptConfig.exclude.push(exclude);
    }
  }

  fs.writeFileSync(tsConfigPath, JSON.stringify(typescriptConfig, undefined, 2) + '\n', 'utf8');
  // fs.writeFileSync(tsRootConfigPath, JSON.stringify(typescriptRootConfig, undefined, 2), 'utf8');
  log('success', 'Typescript project references resolved');
}
