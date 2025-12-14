/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import fs from 'node:path';
import type { Plugin, PluginOption } from 'vite';
import { DynamicPublicDirectory } from 'vite-multiple-assets';

import { getAssets } from './getAssets.js';

export function copyAssetsPlugin(): Plugin | PluginOption {
  const assets = getAssets(fs.join(process.cwd(), 'package.json'));
  const normalizedAssets = assets.map(asset =>
    fs
      .normalize(`${asset}/**`)
      // the DynamicPublicDirectory plugin expects paths to be in posix format (to include images and fonts for windows)
      .replace(/\\/g, '/'),
  );

  return DynamicPublicDirectory(
    normalizedAssets.map(asset => ({
      input: asset,
      output: '/icons',
      flatten: true,
    })),
  );
}
