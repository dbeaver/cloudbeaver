/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { UserProfileTabsService } from '@cloudbeaver/plugin-user-profile';

const UserProfileSettings = importLazyComponent(() => import('./UserProfileSettings').then(module => module.UserProfileSettings));

@injectable()
export class UserProfileSettingsPluginBootstrap extends Bootstrap {
  constructor(private readonly userProfileTabsService: UserProfileTabsService) {
    super();
  }

  register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: 'settings',
      name: 'plugin_user_profile_settings_tab_label',
      order: 2,
      panel: () => UserProfileSettings,
    });
  }
}
