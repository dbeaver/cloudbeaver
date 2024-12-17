/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const navigationTreePlugin: PluginManifest = {
  info: { name: 'Navigation Tree plugin' },
  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./NavigationTree/NavigationTreeService.js').then(m => m.NavigationTreeService),
    () => import('./NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService.js').then(m => m.ElementsTreeToolsMenuService),
    () => import('./NavigationTree/NavigationTreeBootstrap.js').then(m => m.NavigationTreeBootstrap),
    () => import('./NodesManager/NavNodeContextMenuService.js').then(m => m.NavNodeContextMenuService),
    () => import('./NodesManager/NavNodeView/NavNodeViewService.js').then(m => m.NavNodeViewService),
    () =>
      import('./NavigationTree/ElementsTree/ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService.js').then(
        m => m.ElementsTreeSettingsService,
      ),
    () => import('./NavigationTreeSettingsService.js').then(m => m.NavigationTreeSettingsService),
    () => import('./NavigationTree/ElementsTree/ElementsTreeService.js').then(m => m.ElementsTreeService),
    () => import('./NavigationTree/ElementsTree/TreeSelectionService.js').then(m => m.TreeSelectionService),
  ],
};
