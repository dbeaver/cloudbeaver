/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserProfileTabsService } from '../UserProfileTabsService.js';

const UserProfileFormPanel = importLazyComponent(() => import('./UserProfileFormPanel.js').then(module => module.UserProfileFormPanel));

@injectable()
export class UserProfileFormBootstrap extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: 'account',
      name: 'plugin_user_profile_account_title',
      order: 1,
      isHidden: () => this.userInfoResource.isAnonymous,
      panel: () => UserProfileFormPanel,
    });
  }
}
