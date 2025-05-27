/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserDataService } from '@cloudbeaver/core-authentication';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  ACTION_COLLAPSE_ALL,
  ACTION_FILTER,
  ActionService,
  getBindingLabel,
  type IAction,
  KeyBindingService,
  MenuService,
} from '@cloudbeaver/core-view';

import { getNavigationTreeUserSettingsId } from '../../getNavigationTreeUserSettingsId.js';
import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE.js';
import { KEY_BINDING_COLLAPSE_ALL } from '../KEY_BINDING_COLLAPSE_ALL.js';
import { MENU_ELEMENTS_TREE_TOOLS } from './MENU_ELEMENTS_TREE_TOOLS.js';
import { createElementsTreeSettings, validateElementsTreeSettings } from './NavigationTreeSettings/createElementsTreeSettings.js';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT.js';
import { KEY_BINDING_ENABLE_FILTER } from './NavigationTreeSettings/KEY_BINDING_ENABLE_FILTER.js';

@injectable()
export class ElementsTreeToolsMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly userDataService: UserDataService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
  ) {}

  register() {
    this.actionService.addHandler({
      id: 'tree-tools-menu-base-handler',
      isActionApplicable(context, action): boolean {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree) {
          return false;
        }

        if (action === ACTION_COLLAPSE_ALL) {
          return tree.getExpanded().length > 0;
        }

        return false;
      },
      getActionInfo: (context, action) => {
        switch (action) {
          case ACTION_COLLAPSE_ALL: {
            const bindingLabel = getBindingLabel(KEY_BINDING_COLLAPSE_ALL);
            const tooltip = this.localizationService.translate('app_navigationTree_action_collapse_all') + (bindingLabel ? ` (${bindingLabel})` : '');
            return {
              ...action.info,
              tooltip,
            };
          }
        }

        return action.info;
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_ELEMENTS_TREE_TOOLS],
      getItems: (context, items) => [...items, ACTION_COLLAPSE_ALL],
    });

    this.registerBindings();
  }

  private registerBindings() {
    this.actionService.addHandler({
      id: 'nav-tree-filter',
      actions: [ACTION_FILTER],
      contexts: [DATA_CONTEXT_NAV_TREE_ROOT],
      handler: this.switchFilter.bind(this),
    });

    this.actionService.addHandler({
      id: 'elements-tree-base',
      isActionApplicable: (contexts, action): boolean => {
        const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree) {
          return false;
        }

        if (action === ACTION_COLLAPSE_ALL) {
          return tree.getExpanded().length > 0;
        }

        return false;
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'nav-tree-filter',
      binding: KEY_BINDING_ENABLE_FILTER,
      actions: [ACTION_FILTER],
      handler: this.switchFilter.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'elements-tree-collapse',
      binding: KEY_BINDING_COLLAPSE_ALL,
      actions: [ACTION_COLLAPSE_ALL],
      handler: this.elementsTreeActionHandler.bind(this),
    });
  }

  private switchFilter(contexts: IDataContextProvider, action: IAction) {
    const context = contexts.get(DATA_CONTEXT_NAV_TREE_ROOT);

    if (context === undefined) {
      return;
    }

    const state = this.userDataService.getUserData(
      getNavigationTreeUserSettingsId(context),
      createElementsTreeSettings,
      validateElementsTreeSettings,
    );

    state.filter = !state.filter;
  }

  private async elementsTreeActionHandler(contexts: IDataContextProvider, action: IAction) {
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

    if (tree === undefined) {
      return;
    }

    switch (action) {
      case ACTION_COLLAPSE_ALL:
        tree.collapse();
        break;
    }
  }
}
