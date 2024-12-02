/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreNavigationTree: PluginManifest = {
  info: {
    name: 'Core Navigation Tree',
  },

  providers: [
    () => import('./NavTreeSettingsService.js').then(m => m.NavTreeSettingsService),
    () => import('./NodesManager/NavNodeManagerService.js').then(m => m.NavNodeManagerService),
    () => import('./NodesManager/DBObjectResource.js').then(m => m.DBObjectResource),
    () => import('./NodesManager/NavNodeInfoResource.js').then(m => m.NavNodeInfoResource),
    () => import('./NodesManager/NavTreeResource.js').then(m => m.NavTreeResource),
    () => import('./NodesManager/ProjectsNavNodeService.js').then(m => m.ProjectsNavNodeService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
  ],
};
