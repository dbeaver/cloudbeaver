/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';

import { UserFormController } from './UserFormController';

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
