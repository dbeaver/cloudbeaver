/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const navigationTreeRMPlugin: PluginManifest = {
  info: { name: 'Navigation Tree RM plugin' },
  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./NavResourceNodeService.js').then(m => m.NavResourceNodeService),
    () => import('./NavNodes/ResourceFoldersBootstrap.js').then(m => m.ResourceFoldersBootstrap),
    () => import('./NavTreeRMContextMenuService.js').then(m => m.NavTreeRMContextMenuService),
  ],
};
