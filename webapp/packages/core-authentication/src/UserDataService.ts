/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable, untracked } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class UserDataService {
  private readonly userData: Map<string, Record<string, any>>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly autoSaveService: LocalStorageSaveService,
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

  getUserData<T extends Record<any, any>>(key: string, defaultValue: () => T, validate?: (data: T) => boolean): T {
    const userId = this.userInfoResource.getId();

    untracked(() => {
      if (!this.userData.has(userId)) {
        this.userData.set(userId, observable({}));
      }
    });

    const data = this.userData.get(userId)!;

    untracked(() => {
      if (
        !(key in data)
        || validate?.(data[key]) === false
      ) {
        data[key] = observable(defaultValue());
      }
    });

    return data[key];
  }
}
