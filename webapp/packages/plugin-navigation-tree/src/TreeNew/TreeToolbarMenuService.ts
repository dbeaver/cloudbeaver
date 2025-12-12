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

import { DATA_CONTEXT_TREE_TOOLBAR } from './DATA_CONTEXT_TREE_TOOLBAR.js';
import { MENU_TREE_TOOLBAR } from './MENU_TREE_TOOLBAR.js';

@injectable(() => [ActionService, MenuService])
export class TreeToolbarMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  register(): void {
    this.actionService.addHandler({
      id: 'tree-toolbar-menu-base-handler',
      isActionApplicable(context, action): boolean {
        const toolbar = context.get(DATA_CONTEXT_TREE_TOOLBAR);

        if (!toolbar) {
          return false;
        }

        if (action === ACTION_COLLAPSE_ALL) {
          const { getState, getChildren, rootId } = toolbar.treeData;

          const hasExpanded = getChildren(rootId).some(node => getState(node).expanded);
          return hasExpanded;
        }

        return false;
      },
      handler: this.treeToolbarActionHandler.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_TREE_TOOLBAR],
      getItems: (_, items) => [...items, ACTION_COLLAPSE_ALL],
    });
  }

  private treeToolbarActionHandler(contexts: IDataContextProvider, action: IAction): void {
    const toolbar = contexts.get(DATA_CONTEXT_TREE_TOOLBAR);

    if (toolbar === undefined) {
      return;
    }

    switch (action) {
      case ACTION_COLLAPSE_ALL:
        toolbar.treeData.updateAllState({ expanded: false });
        break;
    }
  }
}
