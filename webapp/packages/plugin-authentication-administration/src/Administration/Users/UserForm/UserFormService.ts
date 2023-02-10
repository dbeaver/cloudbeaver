/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { AdminUser } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { Executor } from '@cloudbeaver/core-executor';
import type { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { TabsContainer } from '@cloudbeaver/core-ui';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { UserFormController } from './UserFormController';

export interface IUserFormProps {
  user: AdminUserInfo;
  controller: UserFormController;
  editing?: boolean;
}

export interface IUserFormState {
  user: AdminUser;
  partsState: MetadataMap<string, any>;
  props: IUserFormProps;
}

@injectable()
export class UserFormService {
  readonly onFormInit: Executor;
  readonly tabsContainer: TabsContainer<IUserFormProps>;

  constructor() {
    this.tabsContainer = new TabsContainer('User settings');
    this.onFormInit = new Executor();
  }
}
