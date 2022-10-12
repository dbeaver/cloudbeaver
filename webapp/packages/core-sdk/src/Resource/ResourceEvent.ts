/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { CachedResource } from './CachedResource';

export abstract class ResourceEvent<TEvent> {
  onEvent: ISyncExecutor<TEvent>;

  constructor() {
    this.onEvent = new SyncExecutor();
  }

  on<T>(
    resource: CachedResource<any, T, any, any>,
    mapTo: (param: TEvent) => T
  ): void {
    this.onEvent.addHandler(event => {
      resource.markOutdated(mapTo(event));
    });
  }

  async listen() {
    await this.listener();
  }

  protected abstract listener(): Promise<void>;
}