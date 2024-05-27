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
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./NavigationTree/NavigationTreeService').then(m => m.NavigationTreeService),
    () => import('./NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService').then(m => m.ElementsTreeToolsMenuService),
    () => import('./NavigationTree/NavigationTreeBootstrap').then(m => m.NavigationTreeBootstrap),
    () => import('./NodesManager/NavNodeContextMenuService').then(m => m.NavNodeContextMenuService),
    () => import('./NodesManager/NavNodeView/NavNodeViewService').then(m => m.NavNodeViewService),
    () =>
      import('./NavigationTree/ElementsTree/ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService').then(
        m => m.ElementsTreeSettingsService,
      ),
    () => import('./NavigationTreeSettingsService').then(m => m.NavigationTreeSettingsService),
    () => import('./NavigationTree/ElementsTree/ElementsTreeService').then(m => m.ElementsTreeService),
  ],
};
