/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppScreenService } from '@cloudbeaver/core-app';
import { ActionSnackbar, importLazyComponent } from '@cloudbeaver/core-blocks';
import { LocalStorageSaveService } from '@cloudbeaver/core-browser';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ENotificationType, type INotification, NotificationService } from '@cloudbeaver/core-events';
import { ScreenService } from '@cloudbeaver/core-routing';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_STATE } from '@cloudbeaver/plugin-top-app-bar';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

import { ACTION_APP_HELP } from './actions/ACTION_APP_HELP.js';

const ShortcutsDialog = importLazyComponent(() => import('./Shortcuts/ShortcutsDialog.js').then(m => m.ShortcutsDialog));
const WelcomeDocs = importLazyComponent(() => import('./WelcomeDocs.js').then(m => m.WelcomeDocs));

@injectable()
export class PluginBootstrap extends Bootstrap {
  private errorNotification: INotification<any> | null;
  constructor(
    private readonly menuService: MenuService,
    private readonly screenService: ScreenService,
    private readonly actionService: ActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly localStorageSaveService: LocalStorageSaveService,
    private readonly navigationTabsService: NavigationTabsService,
  ) {
    super();
    this.errorNotification = null;
  }

  override async load(): Promise<void> {}

  override register(): void {
    this.navigationTabsService.welcomeContainer.add(WelcomeDocs, undefined);
    this.addTopAppMenuItems();
    this.addMultiTabSupportNotification();
  }

  private addMultiTabSupportNotification() {
    const displayErrorMessage = () => {
      if (this.errorNotification) {
        return;
      }
      if (this.screenService.isActive(AppScreenService.screenName) && this.localStorageSaveService.storage === 'session') {
        this.errorNotification = this.notificationService.customNotification(
          () => ActionSnackbar,
          {
            actionText: 'plugin_help_multi_tab_support_load_settings',
            onAction: () => {
              this.localStorageSaveService.updateStorage('local');
              this.errorNotification?.close(false);
            },
          },
          {
            type: ENotificationType.Error,
            title: 'plugin_help_multi_tab_support_title',
            message: 'plugin_help_multi_tab_support_description',
            onClose: () => {
              this.errorNotification = null;
            },
          },
        );
      }
    };
    this.localStorageSaveService.onStorageChange.addHandler(displayErrorMessage);

    this.screenService.routeChange.addPostHandler(displayErrorMessage);
  }

  private addTopAppMenuItems() {
    this.menuService.addCreator({
      menus: [MENU_APP_STATE],
      getItems: (context, items) => [...items, ACTION_APP_HELP],
      orderItems: (context, items) => {
        const extracted = menuExtractItems(items, [ACTION_APP_HELP]);

        items.splice(items.length - 1, 0, ...extracted);

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'app-help',
      actions: [ACTION_APP_HELP],
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
