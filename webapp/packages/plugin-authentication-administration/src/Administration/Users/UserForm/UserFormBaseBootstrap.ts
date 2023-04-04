/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React from 'react';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { getOriginTabId } from './getOriginTabId';
import { UserFormService } from './UserFormService';

const OriginInfoPanel = React.lazy(async () => {
  const { OriginInfoPanel } = await import('./OriginInfoPanel');
  return { default: OriginInfoPanel };
});
const OriginInfoTab = React.lazy(async () => {
  const { OriginInfoTab } = await import('./OriginInfoTab');
  return { default: OriginInfoTab };
});
const UserInfo = React.lazy(async () => {
  const { UserInfo } = await import('./UserInfo');
  return { default: UserInfo };
});

@injectable()
export class UserFormBaseBootstrap extends Bootstrap {
  constructor(
    private readonly userFormService: UserFormService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.userFormService.tabsContainer.add({
      key: 'info',
      name: 'authentication_administration_user_info',
      title: 'authentication_administration_user_info',
      order: 1,
      panel: () => UserInfo,
    });
    this.userFormService.tabsContainer.add({
      key: 'origin',
      order: 2,
      generator: (tabId, props) => {
        const origins = props?.user.origins.filter(origin => origin.type !== AUTH_PROVIDER_LOCAL_ID);

        if (origins && origins.length > 0) {
          return origins.map(origin => getOriginTabId(tabId, origin));
        }

        return ['origin'];
      },
      isHidden: (tabId, props) => !props?.user.origins.some(origin => origin.type !== AUTH_PROVIDER_LOCAL_ID),
      panel: () => OriginInfoPanel,
      tab: () => OriginInfoTab,
    });
  }

  load(): void | Promise<void> { }
}
