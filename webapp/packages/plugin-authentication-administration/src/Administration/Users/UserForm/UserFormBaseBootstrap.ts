/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { ConnectionAccess } from './ConnectionAccess';
import { getOriginTabId } from './getOriginTabId';
import { OriginInfoPanel } from './OriginInfoPanel';
import { OriginInfoTab } from './OriginInfoTab';
import { UserFormService } from './UserFormService';
import { UserInfo } from './UserInfo';

@injectable()
export class UserFormBaseBootstrap extends Bootstrap {
  constructor(
    private readonly userFormService: UserFormService
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
    this.userFormService.tabsContainer.add({
      key: 'connections_access',
      name: 'authentication_administration_user_connections_access',
      title: 'authentication_administration_user_connections_access',
      order: 3,
      panel: () => ConnectionAccess,
      onOpen: ({ props }) => props.controller.loadConnectionsAccess(),
    });
  }

  load(): void | Promise<void> { }
}
