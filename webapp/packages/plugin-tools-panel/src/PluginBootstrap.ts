/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_TOOLS } from './Menu/MENU_TOOLS';
import { ToolsPanelService } from './ToolsPanel/ToolsPanelService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly toolsPanelService: ToolsPanelService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [
        ...items,
        MENU_TOOLS,
      ],
    });
    this.menuService.setHandler({
      id: 'tools-menu-base',
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === MENU_TOOLS,
      isLabelVisible: () => false,
      isHidden: () => this.toolsPanelService.disabled,
    });
  }

  load(): void | Promise<void> { }
}