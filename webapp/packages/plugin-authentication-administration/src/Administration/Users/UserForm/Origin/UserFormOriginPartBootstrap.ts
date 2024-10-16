/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserFormService } from '../AdministrationUserFormService.js';

const UserFormOriginInfoPanel = React.lazy(async () => {
  const { UserFormOriginInfoPanel } = await import('./UserFormOriginInfoPanel.js');
  return { default: UserFormOriginInfoPanel };
});

const UserFormOriginInfoTab = React.lazy(async () => {
  const { UserFormOriginInfoTab } = await import('./UserFormOriginInfoTab.js');
  return { default: UserFormOriginInfoTab };
});

@injectable()
export class UserFormOriginPartBootstrap extends Bootstrap {
  constructor(private readonly administrationUserFormService: AdministrationUserFormService) {
    super();
  }

  override register(): void {
    this.administrationUserFormService.parts.add({
      key: 'origin',
      order: 2,
      isHidden: (tabId, props) => props?.formState?.mode !== FormMode.Edit,
      panel: () => UserFormOriginInfoPanel,
      tab: () => UserFormOriginInfoTab,
    });
  }
}
