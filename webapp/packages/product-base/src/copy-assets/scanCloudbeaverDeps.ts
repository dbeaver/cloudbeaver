/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import fs from 'node:fs';
import path from 'node:path';

import { getCloudBeaverDeps } from './getCloudBeaverDeps.js';
import { resolvePathWithPnpApi } from './resolvePathWithPnpApi.js';

export function scanCloudbeaverDeps(packagePath: string): string[] {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const deps = new Set<string>();
  const list = [packageJson.name];

  while (list.length) {
    const dependency = list.shift();

    if (!deps.has(dependency)) {
      const packagePath = path.join(resolvePathWithPnpApi(dependency), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const allDependencies = getCloudBeaverDeps(packageJson);
      list.push(...allDependencies.dependencies, ...allDependencies.peerDependencies);
    }

    deps.add(dependency);
  }

  return Array.from(deps.keys());
}
