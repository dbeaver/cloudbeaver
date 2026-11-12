/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, toJS } from 'mobx';

import { TempMap } from '@cloudbeaver/core-utils';

import type { UserData } from './IUserDataStorage.js';

export class UserDataStore {
  readonly data: Map<string, UserData>;
  private readonly tempData: TempMap<string, UserData>;

  constructor(protected readonly getUserId: () => string) {
    this.data = new Map();

    makeObservable(this, {
      data: observable,
      setData: action,
    });

    this.tempData = new TempMap(this.data);
  }

  getUserData<T extends Record<any, any>>(key: string, defaultValue: () => T, validate?: (data: T) => boolean): T {
    const data = this.getData(this.getUserId());

    if (!(key in data) || validate?.(data[key] as T) === false) {
      data[key] = observable(defaultValue());
    }

    return data[key] as T;
  }

  setData(userId: string, data: UserData): void {
    this.tempData.set(userId, observable(toJS(data)));
  }

  getExistingData(userId: string): UserData | undefined {
    return this.tempData.get(userId);
  }

  protected getData(userId: string): UserData {
    if (!this.tempData.has(userId)) {
      this.tempData.set(userId, observable({}));
    }

    return this.tempData.get(userId)!;
  }
}
