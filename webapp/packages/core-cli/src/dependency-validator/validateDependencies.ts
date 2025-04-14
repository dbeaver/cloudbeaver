/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference types="node" />
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import type { INodePackage } from './INodePackage.js';
import { PackageLogger } from './PackageLogger.js';
import { IGNORED_DEPENDENCIES } from './IGNORED_DEPENDENCIES.js';
import { KNOWN_PEER_DEPS_MAP } from './KNOWN_PEER_DEPS_MAP.js';
import { sortObjectKeys } from '../utils/sortObjectKeys.js';
import { sortDependencies } from './sortDependencies.js';

export function validateDependencies(currentPackageRoot: string) {
  const currentPackagePath = path.join(currentPackageRoot, 'package.json');
  const currentPackageSrcPath = path.join(currentPackageRoot, 'src');
  const currentPackage = JSON.parse(fs.readFileSync(currentPackagePath, 'utf8')) as INodePackage;
  const packageLogger = new PackageLogger(currentPackagePath);

  const dependencies = new Set<string>();
  const devDependencies = new Set<string>();
  const selfImports = new Set<string>();
  let isSuccess = true;

  const sourceFilesIterator = glob.globIterateSync('**/*.{ts,tsx,scss,css}', { cwd: currentPackageSrcPath });
  const referenceRegex = /^\/\/\/\s+<reference\s+types="(.*?)"/gm;
  const importRegex = /^(import|export) ((type |)([\w,\s*]*?)(\{[\w\s\n,]*?\}|) from |)['"]((@[\w-]*\/[\w-]*)|([^\\.].*?))(\/.*)*['"]/gm;
  const testFileRegex = /((__custom_mocks__|__tests__).*|\.test)\.tsx?$/i;
  const tsFileRegex = /\.ts$/i;
  const tsxFileRegex = /\.tsx$/i;
  const styleFileRegex = /\.s?css$/i;
  const cssModuleFileRegex = /\.(m|module)\.s?css$/i;
  const tsConfigPickExtendsRegex = /"extends":\s*"(.*?)"/;
  const packageNameRegex = /^(@[\w-]*\/[\w-]*|[\w-]*)/;

  packageLogger.log('info', true, `Analyzing ${currentPackage['name']}`);

  const isUseCoreCli = Object.values(currentPackage.scripts || {}).some(script => script.includes('core-cli'));

  if (isUseCoreCli && currentPackage.name !== '@cloudbeaver/core-cli') {
    devDependencies.add('@cloudbeaver/core-cli');
  }

  const tsConfigPath = path.join(currentPackageRoot, 'tsconfig.json');

  if (fs.existsSync(tsConfigPath)) {
    const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf8');
    const extendsMatch = tsConfigContent.match(tsConfigPickExtendsRegex);

    if (extendsMatch) {
      const extendsValue = extendsMatch[1]!;

      if (!extendsValue.startsWith('.') && !extendsValue.startsWith('/')) {
        devDependencies.add(extendsValue.match(packageNameRegex)![1]!);
      }
    }
  }

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

    if (isTSXFileRegex) {
      if (isTestFile) {
        devDependencies.add('react');
      } else {
        dependencies.add('react');
      }
      devDependencies.add('@types/react');
    }

    const filePath = path.join(currentPackageSrcPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const matches = fileContent.matchAll(importRegex);
    for (const match of matches) {
      const dep = match[6]!;
      validateDependency(dep);
    }

    const references = fileContent.matchAll(referenceRegex);

    for (const match of references) {
      const dep = match[1]!;

      if (dep.startsWith('.')) {
        continue;
      }

      if (dep === 'node') {
        validateDependency('@types/node', true);
        continue;
      }

      validateDependency(dep.match(packageNameRegex)![1]!, true);
    }

    function validateDependency(dep: string, forceDev = false) {
      if (dep.startsWith('node:') || dep === 'pnpapi') {
        return;
      }

      const peerDeps = KNOWN_PEER_DEPS_MAP[dep] || [];
      if (isStyleFileRegex || isTestFile || forceDev) {
        devDependencies.add(dep);

        for (const peerDep of peerDeps) {
          devDependencies.add(peerDep);
        }
        return;
      }

      if (dep === currentPackage.name) {
        selfImports.add(filePath);
        return;
      }
      dependencies.add(dep);

      for (const peerDep of peerDeps) {
        dependencies.add(peerDep);
      }
    }
  }

  currentPackage.sideEffects = currentPackage.sideEffects || [];

  const sideEffects = ['src/**/*.css', 'src/**/*.scss', 'public/**/*'];

  for (const sideEffect of sideEffects) {
    if (!currentPackage.sideEffects.includes(sideEffect)) {
      currentPackage.sideEffects.push(sideEffect);
    }
  }

  if (selfImports.size > 0) {
    packageLogger.log('error', false, 'Self import found in:', Array.from(selfImports));
  }

  const newDependencies = [...dependencies].sort(sortDependencies);
  const newAllDependencies = [...newDependencies, ...devDependencies].sort(sortDependencies);

  logUnmetAndExtraDependencies('dependencies', newDependencies, currentPackage.dependencies || {}, newAllDependencies);

  currentPackage.dependencies = sortObjectKeys(
    newDependencies.reduce(
      (acc, dep) => ({
        ...acc,
        [dep]: getVersion(dep, acc?.[dep]),
      }),
      currentPackage.dependencies || {},
    ),
  );

  const newDevDependencies = [...devDependencies].sort(sortDependencies);

  logUnmetAndExtraDependencies('dev dependencies', newDevDependencies, currentPackage.devDependencies || {}, newAllDependencies);

  currentPackage.devDependencies = sortObjectKeys(
    [...devDependencies].sort(sortDependencies).reduce(
      (acc, dep) => ({
        ...acc,
        [dep]: getVersion(dep, acc?.[dep]),
      }),
      currentPackage.devDependencies || {},
    ),
  );

  if (isSuccess) {
    packageLogger.log('success', true, 'Dependencies validated successfully');
  }

  if (Object.keys(currentPackage.devDependencies).length === 0) {
    delete currentPackage.devDependencies;
  }
  if (Object.keys(currentPackage.dependencies).length === 0) {
    delete currentPackage.dependencies;
  }

  // Write the updated `package.json`
  fs.writeFileSync(currentPackagePath, JSON.stringify(currentPackage, null, 2) + '\n', 'utf8');

  function getVersion(dependency: string, current?: string) {
    if (dependency.startsWith('@cloudbeaver') || dependency.startsWith('@dbeaver')) {
      return 'workspace:*';
    }

    if (current) {
      return current;
    }

    try {
      if (fs.existsSync(path.join(import.meta.resolve(dependency), 'package.json')) === false) {
        packageLogger.log('error', false, `Dependency ${dependency} not found`);
        return '-1';
      }
    } catch {
      try {
        if (fs.existsSync(path.join('@types', import.meta.resolve(dependency), 'package.json')) === false) {
          packageLogger.log('error', false, `Dependency ${dependency} not found`);
          return '-1';
        } else {
          return '^' + require(path.join('@types', import.meta.resolve(dependency), 'package.json')).version;
        }
      } catch {
        packageLogger.log('error', false, `Dependency ${dependency} not found`);
        return '-1';
      }
    }

    try {
      return '^' + require(path.join(dependency, 'package.json')).version;
    } catch {
      packageLogger.log('error', false, `Dependency ${dependency} not found`);
      return '-1';
    }
  }

  function logUnmetAndExtraDependencies(key: string, newDependencies: string[], current: Record<string, string>, allDependencies: string[] = []) {
    const unmetDependencies = newDependencies.filter(dep => !current?.[dep]);
    const extraDependencies = Object.keys(current || {}).filter(dep => {
      if (IGNORED_DEPENDENCIES.includes(dep)) {
        return false;
      }

      if (newDependencies.includes(dep)) {
        return false;
      }

      if (dep.startsWith('@types/') && allDependencies.includes(dep.replace('@types/', ''))) {
        return false;
      }

      return true;
    });

    if (unmetDependencies.length > 0) {
      packageLogger.log('warn', false, `Unmet ${key} added:`, unmetDependencies);
      isSuccess = false;
    }

    if (extraDependencies.length > 0) {
      packageLogger.log('error', false, `Extra ${key} found:`, extraDependencies);
      isSuccess = false;
    }
  }

  return isSuccess;
}
