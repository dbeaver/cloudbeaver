/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const browserPlugin: PluginManifest = {
  info: { name: 'Browser plugin' },
  preload: [() => import('./PluginBrowserPreloadingBootstrap.js').then(m => m.PluginBrowserPreloadingBootstrap)],
  providers: [() => import('./LocaleService.js').then(m => m.LocaleService)],
};
