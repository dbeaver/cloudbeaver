/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { StorageService } from '@cloudbeaver/core-storage';
import { TempMap } from '@cloudbeaver/core-utils';

import { UserInfoResource } from './UserInfoResource.js';

@injectable()
export class UserDataService {
  private readonly userData: Map<string, Record<string, any>>;
  private readonly tempData: TempMap<string, Record<string, any>>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly storageService: StorageService,
  ) {
    this.userData = new Map();

    makeObservable<this, 'userData'>(this, {
      userData: observable,
    });

    this.tempData = new TempMap(this.userData);

    this.storageService.registerSettings('user_data', this.userData, () => new Map());
  }

  getUserData<T extends Record<any, any>>(key: string, defaultValue: () => T, validate?: (data: T) => boolean): T {
    const userId = this.userInfoResource.getId();

    if (!this.tempData.has(userId)) {
      this.tempData.set(userId, observable({}));
    }

    const data = this.tempData.get(userId)!;

    if (!(key in data) || validate?.(data[key]) === false) {
      data[key] = observable(defaultValue());
    }

    return data[key];
  }
}
