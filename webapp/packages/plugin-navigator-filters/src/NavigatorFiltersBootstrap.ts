/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { DATA_CONTEXT_NAV_NODE } from '@cloudbeaver/core-navigation-tree';
import { DATA_CONTEXT_MENU, DATA_CONTEXT_MENU_NESTED, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';

import { MENU_NAVIGATOR_FILTERS } from './MENU_NAVIGATOR_FILTERS';

@injectable()
export class NavigatorFiltersBootstrap extends Bootstrap {
  constructor(private readonly commonDialogService: CommonDialogService, private readonly menuService: MenuService) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      isApplicable: context => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (!node || !node.folder) {
          return false;
        }

        return !context.hasValue(DATA_CONTEXT_MENU, MENU_NAVIGATOR_FILTERS) && !context.has(DATA_CONTEXT_MENU_NESTED);
      },
      getItems: (context, items) => [...items, MENU_NAVIGATOR_FILTERS],
    });

    this.menuService.addCreator({
      menus: [MENU_NAVIGATOR_FILTERS],
      getItems: (context, items) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        return [
          ...items,
          new MenuBaseItem(
            {
              id: 'mock',
              label: 'Mock',
              tooltip: 'Mock',
            },
            {
              onSelect: () => {
                console.log('Mock', node.id);
              },
            },
          ),
        ];
      },
    });
  }

  load(): void | Promise<void> {}
}
