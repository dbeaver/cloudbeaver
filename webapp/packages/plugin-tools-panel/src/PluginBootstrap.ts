/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { TOP_APP_BAR_MENU } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_TOOLS } from './Menu/MENU_TOOLS';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === TOP_APP_BAR_MENU,
      getItems: (context, items) => [
        ...items,
        MENU_TOOLS,
      ],
    });
  }

  load(): void | Promise<void> { }
}