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

import { UserProfileTabsService } from '../../UserProfileTabsService.js';

const ChangePassword = importLazyComponent(() => import('./ChangePassword.js').then(m => m.ChangePassword));

@injectable()
export class UserProfileFormAuthenticationPartBootstrap extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: 'authentication',
      name: 'ui_authentication',
      order: 4,
      isHidden: () => this.userInfoResource.isAnonymous(),
      panel: () => ChangePassword,
    });
  }
}
