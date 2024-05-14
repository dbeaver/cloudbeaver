/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const devToolsPlugin: PluginManifest = {
  info: {
    name: 'DevTools plugin',
  },
  providers: [() => import('./PluginBootstrap').then(m => m.PluginBootstrap), () => import('./DevToolsService').then(m => m.DevToolsService)],
};
