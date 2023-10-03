/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AUTH_PROVIDER_LOCAL_ID, UsersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserFormService } from '../AdministrationUserFormService';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from '../Info/DATA_CONTEXT_USER_FORM_INFO_PART';
import { getUserFormOriginTabId } from './getUserFormOriginTabId';

const UserFormOriginInfoPanel = React.lazy(async () => {
  const { UserFormOriginInfoPanel } = await import('./UserFormOriginInfoPanel');
  return { default: UserFormOriginInfoPanel };
});

const UserFormOriginInfoTab = React.lazy(async () => {
  const { UserFormOriginInfoTab } = await import('./UserFormOriginInfoTab');
  return { default: UserFormOriginInfoTab };
});

@injectable()
export class UserFormOriginPartBootstrap extends Bootstrap {
  constructor(private readonly administrationUserFormService: AdministrationUserFormService, private readonly usersResource: UsersResource) {
    super();
  }

  register(): void {
    this.administrationUserFormService.parts.add({
      key: 'origin',
      order: 2,
      generator: (tabId, props) => {
        const userFormInfoPart = props?.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);
        if (props?.formState?.mode === FormMode.Edit && userFormInfoPart?.initialState.userId) {
          const user = this.usersResource.get(userFormInfoPart.initialState.userId);
          const origins = user?.origins.filter(origin => origin.type !== AUTH_PROVIDER_LOCAL_ID);

          if (origins && origins.length > 0) {
            return origins.map(origin => getUserFormOriginTabId(tabId, origin));
          }
        }

        return ['origin'];
      },
      isHidden: (tabId, props) => {
        const userFormInfoPart = props?.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);
        if (props?.formState?.mode === FormMode.Edit && userFormInfoPart?.initialState.userId) {
          const user = this.usersResource.get(userFormInfoPart.initialState.userId);
          return !user?.origins.some(origin => origin.type !== AUTH_PROVIDER_LOCAL_ID);
        }
        return true;
      },
      panel: () => UserFormOriginInfoPanel,
      tab: () => UserFormOriginInfoTab,
    });
  }

  load(): void {}
}
