/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { ACTION_COLLAPSE_ALL, ActionService, type IAction, KeyBindingService, MenuService } from '@cloudbeaver/core-view';

import { KEY_BINDING_COLLAPSE_ALL } from '../NavigationTree/ElementsTree/KEY_BINDING_COLLAPSE_ALL.js';
import { DATA_CONTEXT_TREE_DATA, DATA_CONTEXT_TREE_REFRESH } from './DATA_CONTEXT_TREE.js';
import { MENU_TREE_SETTINGS } from './MENU_TREE_SETTINGS.js';
import { MENU_TREE_TOOLBAR } from './MENU_TREE_TOOLBAR.js';
import { ACTION_TREE_REFRESH } from './actions/ACTION_TREE_REFRESH.js';

@injectable(() => [ActionService, MenuService, KeyBindingService])
export class TreeToolbarMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly keyBindingService: KeyBindingService,
  ) {}

  register(): void {
    this.actionService.addHandler({
      id: 'tree-toolbar-menu-base-handler',
      menus: [MENU_TREE_TOOLBAR],
      actions: [ACTION_TREE_REFRESH],
      contexts: [DATA_CONTEXT_TREE_DATA],
      isActionApplicable: context => !!context.get(DATA_CONTEXT_TREE_DATA),
      handler: this.treeToolbarActionHandler.bind(this),
    });

    this.actionService.addHandler({
      id: 'tree-collapse-handler',
      actions: [ACTION_COLLAPSE_ALL],
      contexts: [DATA_CONTEXT_TREE_DATA],
      isActionApplicable(context): boolean {
        const treeData = context.get(DATA_CONTEXT_TREE_DATA);

        if (!treeData) {
          return false;
        }

        const { getState, getChildren, rootId } = treeData;

        return getChildren(rootId).some(node => getState(node).expanded);
      },
      handler: this.treeToolbarActionHandler.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_TREE_TOOLBAR],
      getItems: (_, items) => [...items, MENU_TREE_SETTINGS, ACTION_TREE_REFRESH, ACTION_COLLAPSE_ALL],
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'tree-collapse',
      binding: KEY_BINDING_COLLAPSE_ALL,
      actions: [ACTION_COLLAPSE_ALL],
      contexts: [DATA_CONTEXT_TREE_DATA],
      handler: this.treeToolbarActionHandler.bind(this),
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
