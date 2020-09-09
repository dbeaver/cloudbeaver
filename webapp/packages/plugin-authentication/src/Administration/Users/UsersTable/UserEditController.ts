/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  injectable, IInitializableController, IDestructibleController
} from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GQLErrorCatcher, AdminUserInfo } from '@cloudbeaver/core-sdk';

@injectable()
export class UserEditController
implements IInitializableController, IDestructibleController {
  @observable isLoading = true;
  @observable user: AdminUserInfo | null = null;

  @computed get isDisabled() {
    return this.isLoading;
  }

  userId!: string;

  readonly error = new GQLErrorCatcher();

  constructor(
    private notificationService: NotificationService,
    private usersResource: UsersResource,
  ) { }

  init(id: string) {
    this.userId = id;
    this.loadUser();
  }

  destruct(): void { }

  private async loadUser() {
    this.isLoading = true;
    try {
      // we create a copy to protect the current value from mutation
      this.user = JSON.parse(JSON.stringify(await this.usersResource.load(this.userId)));
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load user ${this.userId}`);
    } finally {
      this.isLoading = false;
    }
  }
}
