/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';

import { UsersAdministrationNavigationService } from './UsersAdministrationNavigationService';

@injectable()
export class CreateUserService {
  @observable user: AdminUserInfo | null = null;

  constructor(
    private readonly usersAdministrationNavigationService: UsersAdministrationNavigationService,
    private readonly usersResource: UsersResource,
  ) {
    this.user = null;

    this.clearUserTemplate = this.clearUserTemplate.bind(this);
    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);
  }

  cancelCreate(): void {
    this.clearUserTemplate();
    this.usersAdministrationNavigationService.navToRoot();
  }

  create(): void {
    if (this.user) {
      return;
    }

    this.user = this.usersResource.getEmptyUser();
    this.usersAdministrationNavigationService.navToCreate();
  }

  clearUserTemplate(): void {
    this.user = null;
  }

  close(): void {
    this.clearUserTemplate();
  }
}
