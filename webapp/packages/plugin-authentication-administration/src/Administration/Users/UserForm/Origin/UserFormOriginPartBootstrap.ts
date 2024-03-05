/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserFormService } from '../AdministrationUserFormService';

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
      isHidden: (tabId, props) => props?.formState?.mode !== FormMode.Edit,
      panel: () => UserFormOriginInfoPanel,
      tab: () => UserFormOriginInfoTab,
    });
  }

  load(): void {}
}
