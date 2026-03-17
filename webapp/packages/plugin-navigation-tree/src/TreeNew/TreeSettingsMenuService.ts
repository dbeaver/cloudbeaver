/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { ActionService, type IAction, MenuService } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_TREE_SETTINGS } from './DATA_CONTEXT_TREE.js';
import { MENU_TREE_SETTINGS } from './MENU_TREE_SETTINGS.js';
import { ACTION_TREE_SAVE_STATE } from './actions/ACTION_TREE_SAVE_STATE.js';
import { ACTION_TREE_SHOW_DESCRIPTIONS } from './actions/ACTION_TREE_SHOW_DESCRIPTIONS.js';
import { ACTION_TREE_SHOW_FILTER } from './actions/ACTION_TREE_SHOW_FILTER.js';
import { TREE_SETTINGS_FILTER_ENABLED } from './useTreeFilter.js';

export const TREE_SETTINGS_SHOW_DESCRIPTIONS = 'tree.showDescriptions';
export const TREE_SETTINGS_SAVE_STATE = 'tree.saveState';

@injectable(() => [ActionService, MenuService])
export class TreeSettingsMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) { }

  register(): void {
    this.actionService.addHandler({
      id: 'tree-settings-handler',
      menus: [MENU_TREE_SETTINGS],
      actions: [ACTION_TREE_SHOW_FILTER, ACTION_TREE_SHOW_DESCRIPTIONS, ACTION_TREE_SAVE_STATE],
      contexts: [DATA_CONTEXT_TREE_SETTINGS],
      isActionApplicable(context: IDataContextProvider): boolean {
        const settings = context.get(DATA_CONTEXT_TREE_SETTINGS);
        return settings !== undefined;
      },
      isChecked(context: IDataContextProvider, action: IAction): boolean {
        const settings = context.get(DATA_CONTEXT_TREE_SETTINGS);

        if (!settings) {
          return false;
        }

        if (action === ACTION_TREE_SHOW_FILTER) {
          return settings.get<boolean>(TREE_SETTINGS_FILTER_ENABLED) ?? false;
        }

        if (action === ACTION_TREE_SHOW_DESCRIPTIONS) {
          return settings.get<boolean>(TREE_SETTINGS_SHOW_DESCRIPTIONS) ?? false;
        }

        if (action === ACTION_TREE_SAVE_STATE) {
          return settings.get<boolean>(TREE_SETTINGS_SAVE_STATE) ?? false;
        }

        return false;
      },
      handler(context: IDataContextProvider, action: IAction): void {
        const settings = context.get(DATA_CONTEXT_TREE_SETTINGS);

        if (!settings) {
          return;
        }

        if (action === ACTION_TREE_SHOW_FILTER) {
          settings.set(TREE_SETTINGS_FILTER_ENABLED, !(settings.get<boolean>(TREE_SETTINGS_FILTER_ENABLED) ?? false));
        } else if (action === ACTION_TREE_SHOW_DESCRIPTIONS) {
          settings.set(TREE_SETTINGS_SHOW_DESCRIPTIONS, !(settings.get<boolean>(TREE_SETTINGS_SHOW_DESCRIPTIONS) ?? false));
        } else if (action === ACTION_TREE_SAVE_STATE) {
          settings.set(TREE_SETTINGS_SAVE_STATE, !(settings.get<boolean>(TREE_SETTINGS_SAVE_STATE) ?? false));
        }
      },
    });

    this.menuService.addCreator({
      menus: [MENU_TREE_SETTINGS],
      getItems: (context, items) => [...items, ACTION_TREE_SHOW_FILTER, ACTION_TREE_SHOW_DESCRIPTIONS, ACTION_TREE_SAVE_STATE],
    });
  }
}
