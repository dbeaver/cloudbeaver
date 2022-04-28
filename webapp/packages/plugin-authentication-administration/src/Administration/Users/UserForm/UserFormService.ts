/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import type { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { TabsContainer } from '@cloudbeaver/core-ui';

import type { UserFormController } from './UserFormController';

export interface IUserFormProps {
  user: AdminUserInfo;
  controller: UserFormController;
  editing?: boolean;
}

@injectable()
export class UserFormService {
  readonly tabsContainer: TabsContainer<IUserFormProps>;

  constructor() {
    this.tabsContainer = new TabsContainer();
  }
}
