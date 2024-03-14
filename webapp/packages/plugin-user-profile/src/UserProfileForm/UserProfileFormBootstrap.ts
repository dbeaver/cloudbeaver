/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserProfileTabsService } from '../UserProfileTabsService';

const UserProfileFormPanel = importLazyComponent(() => import('./UserProfileFormPanel').then(module => module.UserProfileFormPanel));

@injectable()
export class UserProfileFormBootstrap extends Bootstrap {
  constructor(private readonly userProfileTabsService: UserProfileTabsService) {
    super();
  }

  register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: 'account',
      name: 'Account',
      order: 1,
      panel: () => UserProfileFormPanel,
    });
  }
}
