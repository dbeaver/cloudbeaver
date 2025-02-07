/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DATA_CONTEXT_NAV_NODE, ENodeFeature, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';

import { MENU_NAVIGATION_TREE_FILTERS } from './MENU_NAVIGATION_TREE_FILTERS.js';

const NavigationTreeFiltersDialog = importLazyComponent(() =>
  import('./NavigationTreeFiltersDialog/NavigationTreeFiltersDialog.js').then(m => m.NavigationTreeFiltersDialog),
);

@injectable()
export class NavigationTreeFiltersBootstrap extends Bootstrap {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
    private readonly navTreeResource: NavTreeResource,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_NAV_NODE],
      isApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        if (!node.features?.includes(ENodeFeature.canFilter)) {
          return false;
        }

        return !context.hasValue(DATA_CONTEXT_MENU, MENU_NAVIGATION_TREE_FILTERS);
      },
      getItems: (context, items) => [...items, MENU_NAVIGATION_TREE_FILTERS],
    });

    this.menuService.addCreator({
      menus: [MENU_NAVIGATION_TREE_FILTERS],
      contexts: [DATA_CONTEXT_NAV_NODE],
      getItems: (context, items) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        const actions = [
          new MenuBaseItem(
            {
              id: 'configure-filter',
              label: this.localizationService.translate('plugin_navigation_tree_filters_configuration', undefined, { name: node.name }) + '...',
            },
            {
              onSelect: async () => {
                await this.commonDialogService.open(NavigationTreeFiltersDialog, { node });
              },
            },
          ),
        ];

        if (node.filtered) {
          actions.push(
            new MenuBaseItem(
              {
                id: 'reset-filter',
                label: 'plugin_navigation_tree_filters_reset',
              },
              {
                onSelect: async () => {
                  try {
                    await this.navTreeResource.setFilter(node.id, [], []);
                  } catch (exception: any) {
                    this.notificationService.logException(exception, 'plugin_navigation_tree_filters_reset_fail');
                  }
                },
              },
            ),
          );
        }

        return [...items, ...actions];
      },
    });
  }
}
