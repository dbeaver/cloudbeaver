/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { UserSettingsService } from '@cloudbeaver/core-settings-user';
import { ACTION_SETTINGS, ActionService, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';
import { UserProfileOptionsPanelService, UserProfileTabsService } from '@cloudbeaver/plugin-user-profile';

const UserProfileSettings = importLazyComponent(() => import('./UserProfileSettings.js').then(module => module.UserProfileSettings));

const SETTINGS_TAB_ID = 'settings';

export class UserProfileSettingsPluginBootstrapImpl extends Bootstrap {
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
    this.userProfileOptionsPanelService.onClose.addHandler(this.confirmDiscardChanges.bind(this));
    this.userProfileTabsService.onBeforeTabChange.addHandler(this.confirmDiscardChanges.bind(this));

    this.userProfileTabsService.tabContainer.add({
      key: SETTINGS_TAB_ID,
      name: 'plugin_user_profile_settings_tab_label',
      icon: '/icons/core_blocks_sliders.svg',
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
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      actions: [ACTION_SETTINGS],
      getActionInfo(context, action) {
        return {
          ...action,
          icon: undefined,
          label: 'plugin_user_profile_settings_tab_label',
          tooltip: 'plugin_user_profile_settings_action_description',
        };
      },
      handler: async () => {
        await this.userProfileTabsService.open(SETTINGS_TAB_ID);
      },
    });
  }

  private async confirmDiscardChanges(_: unknown, contexts: IExecutionContextProvider<any>): Promise<void> {
    if (!this.userSettingsService.isEdited()) {
      return;
    }

    const { status } = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_discard_changes',
      message: 'ui_discard_changes_message',
      confirmActionText: 'ui_discard',
      cancelActionText: 'ui_keep_editing',
    });

    if (status === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
      return;
    }

    this.userSettingsService.resetChanges();
  }
}

export type UserProfileSettingsPluginBootstrap = UserProfileSettingsPluginBootstrapImpl;

export class UserProfileSettingsPluginBootstrapDI extends Context.Service<
  UserProfileSettingsPluginBootstrapDI,
  UserProfileSettingsPluginBootstrapImpl
>()('@cloudbeaver/plugin-user-profile-settings/UserProfileSettingsPluginBootstrap#UserProfileSettingsPluginBootstrap') {
  static readonly implementation = UserProfileSettingsPluginBootstrapImpl;

  static readonly dependencies = () =>
    [UserProfileTabsService, MenuService, ActionService, UserProfileOptionsPanelService, UserSettingsService, CommonDialogService] as const;
  static readonly make: Effect.Effect<
    UserProfileSettingsPluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof UserProfileTabsService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof UserProfileOptionsPanelService>
    | Context.Service.Identifier<typeof UserSettingsService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Effect.gen(function* makeUserProfileSettingsPluginBootstrap() {
    const userProfileTabsService = yield* UserProfileTabsService;
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const userProfileOptionsPanelService = yield* UserProfileOptionsPanelService;
    const userSettingsService = yield* UserSettingsService;
    const commonDialogService = yield* CommonDialogService;

    return new UserProfileSettingsPluginBootstrapImpl(
      userProfileTabsService,
      menuService,
      actionService,
      userProfileOptionsPanelService,
      userSettingsService,
      commonDialogService,
    );
  });
  static readonly layer: Layer.Layer<
    UserProfileSettingsPluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof UserProfileTabsService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof UserProfileOptionsPanelService>
    | Context.Service.Identifier<typeof UserSettingsService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserProfileSettingsPluginBootstrap = UserProfileSettingsPluginBootstrapDI;
