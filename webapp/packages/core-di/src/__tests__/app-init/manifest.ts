/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '../../PluginManifest.js';

export const manifest: PluginManifest = {
  info: {
    name: 'Sample Manifest',
  },
  providers: [() => import('./TestService.js').then(m => m.TestService), () => import('./TestBootstrap.js').then(m => m.TestBootstrap)],
};
