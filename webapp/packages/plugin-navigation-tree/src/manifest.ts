/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { ElementsTreeService } from './NavigationTree/ElementsTree/ElementsTreeService';
import { ElementsTreeToolsMenuService } from './NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService';
import { ElementsTreeSettingsService } from './NavigationTree/ElementsTree/ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService';
import { NavigationTreeBootstrap } from './NavigationTree/NavigationTreeBootstrap';
import { NavigationTreeService } from './NavigationTree/NavigationTreeService';
import { NavigationTreeSettingsService } from './NavigationTreeSettingsService';
import { NavNodeContextMenuService } from './NodesManager/NavNodeContextMenuService';
import { NavNodeViewService } from './NodesManager/NavNodeView/NavNodeViewService';

export const navigationTreePlugin: PluginManifest = {
  info: { name: 'Navigation Tree plugin' },
  providers: [
    LocaleService,
    NavigationTreeService,
    ElementsTreeToolsMenuService,
    NavigationTreeBootstrap,
    NavNodeContextMenuService,
    NavNodeViewService,
    ElementsTreeSettingsService,
    NavigationTreeSettingsService,
    ElementsTreeService,
  ],
};
