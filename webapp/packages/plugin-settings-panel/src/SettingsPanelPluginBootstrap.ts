/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { ACTION_OPEN_APP_SETTINGS } from './actions/ACTION_OPEN_APP_SETTINGS';
import { SettingsPanelForm } from './SettingsPanel/SettingsPanelForm';

@injectable()
export class SettingsPanelPluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly authInfoService: AuthInfoService,
    private readonly actionService: ActionService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.addTopAppMenuItems();
  }

  load(): void | Promise<void> {}

  private addTopAppMenuItems() {
    this.actionService.addHandler({
      id: 'open-app-settings',
      isActionApplicable: (context, action) => ACTION_OPEN_APP_SETTINGS === action,
      handler: () => this.optionsPanelService.open(() => SettingsPanelForm),
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU && !!this.authInfoService.userInfo,
      getItems: (context, items) => [...items, ACTION_OPEN_APP_SETTINGS],
    });
  }
}
