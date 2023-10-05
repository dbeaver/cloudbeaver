#!/usr/bin/env node

'use strict';
require('./validate-dependencies');
process.title = 'typescript-resolve-references';

const fs = require('fs');
const { resolve, relative, join } = require('path');
const { getCloudBeaverDeps } = require('../utils/getCloudBeaverDeps');

const tsConfigPath = resolve('tsconfig.json');
// const tsRootPath = resolve('../../');
// const tsRootConfigPath = resolve(join(tsRootPath, 'tsconfig.json'));
const pkg = require(resolve('package.json'));
const typescriptConfig = require(tsConfigPath);
// const typescriptRootConfig = require(tsRootConfigPath);

const dependencies = getCloudBeaverDeps(pkg);
const currentDir = resolve();

const nodeModules = [resolve('node_modules')];

typescriptConfig.references = [];
// typescriptRootConfig.references = typescriptRootConfig.references || [];

for (const dependency of dependencies) {
  const dependencyPath = resolve(require.resolve(join(dependency, 'src', 'index.ts'), { paths: nodeModules }), '../..');
  typescriptConfig.references.push({
    path: relative(currentDir, dependencyPath),
  });

  // const relativePath = relative(tsRootPath, dependencyPath);

  // if (!typescriptRootConfig.references.find(ref => ref.path === relativePath)) {
  //   typescriptRootConfig.references.push({
  //     path: relativePath,
  //   });
  // }
}

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

fs.writeFileSync(tsConfigPath, JSON.stringify(typescriptConfig, undefined, 2), 'utf8');
// fs.writeFileSync(tsRootConfigPath, JSON.stringify(typescriptRootConfig, undefined, 2), 'utf8');
