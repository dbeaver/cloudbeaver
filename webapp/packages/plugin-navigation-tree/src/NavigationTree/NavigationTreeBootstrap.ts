/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LeftBarPanelService } from '@cloudbeaver/core-ui';

import { NavigationTreeSettingsService } from '../NavigationTreeSettingsService.js';
import { ElementsTreeToolsMenuService } from './ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService.js';

const NavigationTreePanel = importLazyComponent(() => import('./NavigationTreePanel.js').then(m => m.NavigationTreePanel));

@injectable()
export class NavigationTreeBootstrap extends Bootstrap {
  constructor(
    private readonly navigationTreeSettingsService: NavigationTreeSettingsService,
    private readonly elementsTreeToolsMenuService: ElementsTreeToolsMenuService,
    private readonly leftBarPanelService: LeftBarPanelService,
  ) {
    super();
  }

  override register(): void {
    this.elementsTreeToolsMenuService.register();
    this.leftBarPanelService.tabsContainer.add({
      key: 'navigation-tree-tab',
      order: 0,
      name: 'plugin_navigation_tree_explorer_tab_title',
      isHidden: () => this.navigationTreeSettingsService.disabled,
      panel: () => NavigationTreePanel,
    });
  }
}
