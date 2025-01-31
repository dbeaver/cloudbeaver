/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import fs from 'node:fs';
import path from 'node:path';

import { scanCloudbeaverDeps } from './scanCloudbeaverDeps.js';
import { resolvePathWithPnpApi } from './resolvePathWithPnpApi.js';

export function getAssets(packagePath: string) {
  const patterns = scanCloudbeaverDeps(packagePath)
    .reverse()
    .map(dependency => path.join(resolvePathWithPnpApi(dependency), 'public'));

  return patterns.filter(pattern => fs.existsSync(pattern));
}
