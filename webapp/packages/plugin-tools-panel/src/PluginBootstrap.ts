/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { BottomPanelService } from '@cloudbeaver/core-ui';
import { MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_TOOLS } from './Menu/MENU_TOOLS.js';
import { ToolsPanelService } from './ToolsPanel/ToolsPanelService.js';

@injectable(() => [MenuService, ToolsPanelService, BottomPanelService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly toolsPanelService: ToolsPanelService,
    private readonly bottomPanelService: BottomPanelService,
  ) {
    super();
  }

  override register(): void {
    this.bottomPanelService.isDisabled = () => this.toolsPanelService.disabled;

    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, MENU_TOOLS],
    });

    this.menuService.setHandler({
      id: 'tools-menu-base',
      menus: [MENU_TOOLS],
      isLabelVisible: () => false,
      isHidden: () => this.toolsPanelService.disabled,
    });
  }
}
