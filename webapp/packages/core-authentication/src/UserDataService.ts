/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class UserDataService {
  private userData: Map<string, Record<string, any>>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private autoSaveService: LocalStorageSaveService,
  ) {
    this.userData = new Map();

    makeObservable<this, 'userData'>(this, {
      userData: observable,
    });

    this.autoSaveService.withAutoSave(
      this.userData,
      'user_data',
    );
  }

  getUserData<T>(key: string, defaultValue: () => T): T {
    const userId = this.userInfoResource.getId();

    if (!this.userData.has(userId)) {
      this.userData.set(userId, observable({}));
    }

    const data = this.userData.get(userId)!;

    if (key in data) {
      return data[key];
    }

    data[key] = defaultValue();

    return data[key];
  }
}
