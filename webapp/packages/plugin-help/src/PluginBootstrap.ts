/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_STATE } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_APP_HELP } from './actions/ACTION_APP_HELP';
import { ShortcutsDialog } from './Shortcuts/ShortcutsDialog';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly localStorageSaveService: LocalStorageSaveService,
  ) {
    super();
  }

  async load(): Promise<void> { }

  register(): void {
    this.addTopAppMenuItems();
    this.addMultiTabSupportNotification();
  }

  private addMultiTabSupportNotification() {
    this.localStorageSaveService.onStateChange.addHandler(mainStore => {
      if (mainStore === 'session') {
        this.notificationService.logError({
          title: 'plugin_help_multi_tab_support_title',
          message: 'plugin_help_multi_tab_support_description',
        });
      }
    });
  }

  private addTopAppMenuItems() {
    this.menuService.addCreator({
      menus: [MENU_APP_STATE],
      getItems: (context, items) => [
        ...items,
        ACTION_APP_HELP,
      ],
      orderItems: (context, items) => {
        const extracted = menuExtractItems(items, [ACTION_APP_HELP]);

        items.splice(items.length - 1, 0, ...extracted);

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'app-help',
      isActionApplicable: (context, action) => [
        ACTION_APP_HELP,
      ].includes(action),
      handler: async (context, action) => {
        switch (action) {
          case ACTION_APP_HELP: {
            await this.commonDialogService.open(ShortcutsDialog, null);
            break;
          }
        }
      },
    });
  }
}
