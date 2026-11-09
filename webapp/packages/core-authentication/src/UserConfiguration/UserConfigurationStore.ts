/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IReactionDisposer, reaction, toJS } from 'mobx';

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
  ) {
    super(getUserId);
  }

  async load(): Promise<void> {
    this.stop();

    const userId = this.getUserId();
    const data = await this.source.load();

    this.setData(userId, data);

    const state = this.getData(userId);
    this.subscription = reaction(
      () => toJS(state),
      data => this.source.save(data).catch(console.error),
      { delay: 500 },
    );
  }

  stop(): void {
    this.subscription?.();
    this.subscription = undefined;
  }
}
