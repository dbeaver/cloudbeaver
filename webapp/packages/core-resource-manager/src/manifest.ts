/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const resourceManagerManifest: PluginManifest = {
  info: {
    name: 'Resource Manager Core',
  },

  providers: [
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./SharedProjectsResource.js').then(m => m.SharedProjectsResource),
    () => import('./ProjectPermissionsResource.js').then(m => m.ProjectPermissionsResource),
    () => import('./ResourceManagerEventHandler.js').then(m => m.ResourceManagerEventHandler),
    () => import('./ResourceManagerResource.js').then(m => m.ResourceManagerResource),
    () => import('./LocaleService.js').then(m => m.LocaleService),
  ],
};
