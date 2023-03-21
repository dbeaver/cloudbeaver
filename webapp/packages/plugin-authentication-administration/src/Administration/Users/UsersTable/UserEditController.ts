/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  injectable, IInitializableController, IDestructibleController
} from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GQLErrorCatcher, AdminUserInfo, ResourceKeyUtils, ResourceKey, ResourceKeySimple } from '@cloudbeaver/core-sdk';

@injectable()
export class UserEditController
implements IInitializableController, IDestructibleController {
  isLoading = true;
  user: AdminUserInfo | null = null;

  get isDisabled() {
    return this.usersResource.isLoading(this.userId);
  }

  userId!: string;

  readonly error = new GQLErrorCatcher();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly usersResource: UsersResource
  ) {
    makeObservable(this, {
      isLoading: observable,
      user: observable,
      isDisabled: computed,
    });

    this.updateUser = this.updateUser.bind(this);
  }

  async init(id: string): Promise<void> {
    this.userId = id;

    await this.loadUser();
    this.usersResource.onItemUpdate.addHandler(this.updateUser);
  }

  destruct(): void {
    this.usersResource.onItemUpdate.removeHandler(this.updateUser);
  }

  private async loadUser() {
    try {
      // we create a copy to protect the current value from mutation
      await this.usersResource.load(this.userId, ['includeMetaParameters']);
      await this.updateUser(this.userId);
    } catch (exception: any) {
      this.notificationService.logException(exception, `Can't load user ${this.userId}`);
    }
  }

  private async updateUser(key: ResourceKeySimple<string>) {
    if (!ResourceKeyUtils.isIntersect(key, this.userId)) {
      return;
    }
    this.user = JSON.parse(JSON.stringify(await this.usersResource.load(this.userId, ['includeMetaParameters'])));
  }
}
