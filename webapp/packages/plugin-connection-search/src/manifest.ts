/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const connectionSearchPlugin: PluginManifest = {
  info: {
    name: 'Search connection plugin',
  },
  providers: [
    () => import('./SearchConnectionPluginBootstrap.js').then(m => m.SearchConnectionPluginBootstrap),
    () => import('./Search/ConnectionSearchService.js').then(m => m.ConnectionSearchService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ConnectionSearchSettingsService.js').then(m => m.ConnectionSearchSettingsService),
  ],
};
