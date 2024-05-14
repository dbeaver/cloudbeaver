/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreBrowserManifest: PluginManifest = {
  info: {
    name: 'Core Browser',
  },

  preload: [
    () => import('./ServiceWorkerBootstrap').then(module => module.ServiceWorkerBootstrap),
    () => import('./ServiceWorkerService').then(module => module.ServiceWorkerService),
  ],
  providers: [
    () => import('./IndexedDB/IndexedDBService').then(module => module.IndexedDBService),
    () => import('./LocalStorageSaveService').then(module => module.LocalStorageSaveService),
  ],
};
