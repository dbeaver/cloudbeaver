/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { UserSettingsService } from '@cloudbeaver/core-settings-user';
import { ACTION_SETTINGS, ActionService, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';
import { UserProfileOptionsPanelService, UserProfileTabsService } from '@cloudbeaver/plugin-user-profile';

const UserProfileSettings = importLazyComponent(() => import('./UserProfileSettings.js').then(module => module.UserProfileSettings));

const SETTINGS_TAB_ID = 'settings';

@injectable()
export class UserProfileSettingsPluginBootstrap extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly userProfileOptionsPanelService: UserProfileOptionsPanelService,
    private readonly userSettingsService: UserSettingsService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void {
    this.userProfileOptionsPanelService.onClose.addHandler(async (data, context) => {
      if (!this.userSettingsService.isEdited()) {
        return;
      }

      const result = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'ui_save_reminder',
        message: 'ui_are_you_sure',
      });

      if (result === DialogueStateResult.Rejected) {
        ExecutorInterrupter.interrupt(context);
        return;
      }

      this.userSettingsService.resetChanges();
    });

    this.userProfileTabsService.tabContainer.add({
      key: SETTINGS_TAB_ID,
      name: 'plugin_user_profile_settings_tab_label',
      order: 3,
      panel: () => UserProfileSettings,
    });

    this.menuService.addCreator({
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      getItems(context, items) {
        return [...items, ACTION_SETTINGS];
      },
    });

    this.actionService.addHandler({
      id: 'settings',
      actions: [ACTION_SETTINGS],
      getActionInfo(context, action) {
        return {
          ...action,
          icon: undefined,
          label: 'plugin_user_profile_settings_tab_label',
          tooltip: 'plugin_user_profile_settings_action_description',
        };
      },
      handler: () => {
        this.userProfileOptionsPanelService.open(SETTINGS_TAB_ID);
      },
    });
  }
}
