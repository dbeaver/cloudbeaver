#!/usr/bin/env node

'use strict';
require('./validate-dependencies');
process.title = 'typescript-resolve-references';

const fs = require('fs');
const { resolve, join } = require('path');
const upath = require('upath');
const { getCloudBeaverDeps } = require('../utils/getCloudBeaverDeps');

const tsConfigPath = resolve('tsconfig.json');
// const tsRootPath = resolve('../../');
// const tsRootConfigPath = resolve(join(tsRootPath, 'tsconfig.json'));
const pkg = require(resolve('package.json'));
const typescriptConfig = require(tsConfigPath);
// const typescriptRootConfig = require(tsRootConfigPath);

const allDependencies = getCloudBeaverDeps(pkg);
const dependencies = [...allDependencies.dependencies, ...allDependencies.devDependencies, ...allDependencies.peerDependencies];
const currentDir = resolve();

const nodeModules = [resolve('node_modules')];

typescriptConfig.references = [];
// typescriptRootConfig.references = typescriptRootConfig.references || [];

for (const dependency of dependencies) {
  if (dependency === pkg.name) {
    console.error(`Self reference detected: ${dependency}`);
    continue;
  }
  try {
    if (!dependency.startsWith('@cloudbeaver')) {
      continue;
    }
    const dependencyPath = resolve(require.resolve(join(dependency, 'src', 'index.ts'), { paths: nodeModules }), '../../tsconfig.json');
    typescriptConfig.references.push({
      path: upath.relative(currentDir, dependencyPath),
    });

    // const relativePath = relative(tsRootPath, dependencyPath);

    // if (!typescriptRootConfig.references.find(ref => ref.path === relativePath)) {
    //   typescriptRootConfig.references.push({
    //     path: relativePath,
    //   });
    // }
  } catch (e) {
    console.error(`Failed to resolve ${dependency}`);
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
