/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { NavNodeViewService } from './NodesManager/NavNodeView/NavNodeViewService.js';
import { NavigationTreeSettingsService } from './NavigationTreeSettingsService.js';
import { NavNodeContextMenuService } from './NodesManager/NavNodeContextMenuService.js';
import { TreeSelectionService } from './NavigationTree/ElementsTree/TreeSelectionService.js';
import { NavigationTreeBootstrap } from './NavigationTree/NavigationTreeBootstrap.js';
import { NavigationTreeService } from './NavigationTree/NavigationTreeService.js';
import { ElementsTreeSettingsService } from './NavigationTree/ElementsTree/ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService.js';
import { ElementsTreeToolsMenuService } from './NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService.js';
import { ElementsTreeService } from './NavigationTree/ElementsTree/ElementsTreeService.js';
import { TreeToolbarMenuService } from './TreeNew/TreeToolbarMenuService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-navigation-tree',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(NavigationTreeBootstrap))
      .addSingleton(Bootstrap, proxy(NavNodeContextMenuService))
      .addSingleton(Dependency, proxy(NavigationTreeSettingsService))
      .addSingleton(NavNodeViewService)
      .addSingleton(NavigationTreeSettingsService)
      .addSingleton(NavNodeContextMenuService)
      .addSingleton(TreeSelectionService)
      .addSingleton(NavigationTreeBootstrap)
      .addSingleton(NavigationTreeService)
      .addSingleton(ElementsTreeSettingsService)
      .addSingleton(ElementsTreeToolsMenuService)
      .addSingleton(TreeToolbarMenuService)
      .addSingleton(ElementsTreeService);
  },
});
