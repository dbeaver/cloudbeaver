/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IReactionDisposer, reaction, runInAction, toJS } from 'mobx';

import { isObjectsEqual } from '@cloudbeaver/core-utils';

import type { UserData } from '../IUserDataStorage.js';
import { UserDataStore } from '../UserDataStore.js';

interface IUserConfigurationSync {
  load(): Promise<UserData>;
  save(data: UserData): Promise<void>;
}

export class UserConfigurationStore extends UserDataStore {
  private subscription: IReactionDisposer | undefined;

  constructor(
    getUserId: () => string,
    private readonly source: IUserConfigurationSync,
    private readonly localUserDataStore: UserDataStore,
  ) {
    super(getUserId);
  }

  override getUserData<T extends Record<any, any>>(key: string, defaultValue: () => T, validate?: (data: T) => boolean): T {
    const userId = this.getUserId();
    const localSettings = this.localUserDataStore.getExistingData(userId);
    const shouldTransfer = localSettings !== undefined && Object.hasOwn(localSettings, key);

    if (shouldTransfer) {
      // Share the observable until it is saved, so repeated reads cannot restore an old local value.
      this.getData(userId)[key] = this.localUserDataStore.getUserData(key, defaultValue, validate);
    }

    return super.getUserData(key, defaultValue, validate);
  }

  async load(): Promise<void> {
    this.stop();

    const userId = this.getUserId();
    const data = await this.source.load();

    this.setData(userId, data);

    const state = this.getData(userId);
    this.subscription = reaction(
      () => toJS(state),
      data => this.saveConfiguration(userId, state, data).catch(console.error),
      { delay: 500 },
    );
  }

  stop(): void {
    this.subscription?.();
    this.subscription = undefined;
  }

  private async saveConfiguration(userId: string, state: UserData, snapshot: UserData): Promise<void> {
    await this.source.save(snapshot);

    const localSettings = this.localUserDataStore.getExistingData(userId);

    if (!localSettings) {
      return;
    }

    runInAction(() => {
      for (const [key, value] of Object.entries(snapshot)) {
        const shouldDelete = localSettings[key] === state[key] && isObjectsEqual(toJS(localSettings[key]), value);

        if (shouldDelete) {
          delete localSettings[key];
        }
      }
    });
  }
}
