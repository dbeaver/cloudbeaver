/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LeftBarPanelService } from '@cloudbeaver/core-ui';

import { NavigationTreeSettingsService } from '../NavigationTreeSettingsService';
import { ElementsTreeToolsMenuService } from './ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService';
import { NavigationTreePanel } from './NavigationTreePanel';

@injectable()
export class NavigationTreeBootstrap extends Bootstrap {
  constructor(
    private readonly navigationTreeSettingsService: NavigationTreeSettingsService,
    private readonly elementsTreeToolsMenuService: ElementsTreeToolsMenuService,
    private readonly leftBarPanelService: LeftBarPanelService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.elementsTreeToolsMenuService.register();
    this.leftBarPanelService.tabsContainer.add({
      key: 'navigation-tree-tab',
      order: 0,
      name: 'plugin_navigation_tree_explorer_tab_title',
      isHidden: () => this.navigationTreeSettingsService.disabled,
      panel: () => NavigationTreePanel,
    });
  }

  async load(): Promise<void> { }
}