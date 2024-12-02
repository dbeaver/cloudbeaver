/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

//
export const resourceManagerPlugin: PluginManifest = {
  info: { name: 'Resource manager plugin' },
  providers: [
    () => import('./ResourceManagerSettingsService.js').then(m => m.ResourceManagerSettingsService),
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ResourceManagerService.js').then(m => m.ResourceManagerService),
    // () => import('./ResourceProjectsResource.js').then(m => m.ResourceProjectsResource),
  ],
};
