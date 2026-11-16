/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { ElementsTreeService } from './NavigationTree/ElementsTree/ElementsTreeService.js';
import { ElementsTreeToolsMenuService } from './NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService.js';
import { ElementsTreeSettingsService } from './NavigationTree/ElementsTree/ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService.js';
import { TreeSelectionService } from './NavigationTree/ElementsTree/TreeSelectionService.js';
import { NavigationTreeBootstrap } from './NavigationTree/NavigationTreeBootstrap.js';
import { NavigationTreeService } from './NavigationTree/NavigationTreeService.js';
import { NavigationTreeSettingsService } from './NavigationTreeSettingsService.js';
import { NavNodeContextMenuService } from './NodesManager/NavNodeContextMenuService.js';
import { NavNodeViewService } from './NodesManager/NavNodeView/NavNodeViewService.js';
import { NodeDeletionService } from './NodesManager/NodeDeletion/NodeDeletionService.js';
import { TreeSettingsMenuService } from './TreeNew/TreeSettingsMenuService.js';
import { TreeToolbarMenuService } from './TreeNew/TreeToolbarMenuService.js';
import { TreeViewService } from './TreeNew/TreeViewService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-navigation-tree',

  services: () => [
    NavNodeViewService,
    NavigationTreeSettingsService,
    NavNodeContextMenuService,
    NodeDeletionService,
    TreeSelectionService,
    NavigationTreeBootstrap,
    NavigationTreeService,
    ElementsTreeSettingsService,
    ElementsTreeToolsMenuService,
    TreeToolbarMenuService,
    TreeSettingsMenuService,
    TreeViewService,
    ElementsTreeService,
  ],
  bootstraps: () => [LocaleService, NavigationTreeBootstrap, NavNodeContextMenuService],
});
