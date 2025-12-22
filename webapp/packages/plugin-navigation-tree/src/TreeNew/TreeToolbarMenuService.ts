/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { ACTION_COLLAPSE_ALL, ActionService, type IAction, MenuService } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_TREE_DATA, DATA_CONTEXT_TREE_REFRESH } from './DATA_CONTEXT_TREE.js';
import { MENU_TREE_TOOLBAR } from './MENU_TREE_TOOLBAR.js';
import { ACTION_TREE_REFRESH } from './actions/ACTION_TREE_REFRESH.js';

@injectable(() => [ActionService, MenuService])
export class TreeToolbarMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  register(): void {
    this.actionService.addHandler({
      id: 'tree-toolbar-menu-base-handler',
      menus: [MENU_TREE_TOOLBAR],
      actions: [ACTION_TREE_REFRESH, ACTION_COLLAPSE_ALL],
      contexts: [DATA_CONTEXT_TREE_DATA],
      isActionApplicable(context, action): boolean {
        const treeData = context.get(DATA_CONTEXT_TREE_DATA);

        if (!treeData) {
          return false;
        }

        if (action === ACTION_COLLAPSE_ALL) {
          const { getState, getChildren, rootId } = treeData;

          const hasExpanded = getChildren(rootId).some(node => getState(node).expanded);
          return hasExpanded;
        }

        if (action === ACTION_TREE_REFRESH) {
          return true;
        }

        return false;
      },
      handler: this.treeToolbarActionHandler.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_TREE_TOOLBAR],
      getItems: (_, items) => [...items, ACTION_TREE_REFRESH, ACTION_COLLAPSE_ALL],
    });
  }

  private async treeToolbarActionHandler(contexts: IDataContextProvider, action: IAction): Promise<void> {
    const treeData = contexts.get(DATA_CONTEXT_TREE_DATA);

    if (treeData === undefined) {
      return;
    }

    switch (action) {
      case ACTION_COLLAPSE_ALL:
        treeData.updateAllState({ expanded: false });
        break;
      case ACTION_TREE_REFRESH: {
        const refresh = contexts.get(DATA_CONTEXT_TREE_REFRESH);
        if (refresh) {
          await refresh();
        } else {
          await treeData.load(treeData.rootId, true);
        }
        break;
      }
    }
  }
}
