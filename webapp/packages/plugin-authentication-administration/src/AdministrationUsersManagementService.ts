/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { type ILoadableState, isArraysEqual } from '@cloudbeaver/core-utils';

import { externalUserProviderStatusContext } from './externalUserProviderStatusContext.js';

@injectable()
export class AdministrationUsersManagementService {
  get externalUserProviderEnabled(): boolean {
    const contexts = this.getExternalUserProviderStatus.execute();
    const projectsContext = contexts.getContext(externalUserProviderStatusContext);

    return projectsContext.externalUserProviderEnabled;
  }

  get loaders(): ILoadableState[] {
    const contexts = this.getExternalUserProviderStatus.execute();
    const projectsContext = contexts.getContext(externalUserProviderStatusContext);

    return projectsContext.loaders;
  }

  readonly getExternalUserProviderStatus: ISyncExecutor;

  constructor() {
    makeObservable(this, {
      externalUserProviderEnabled: computed,
      loaders: computed<ILoadableState[]>({ equals: (a, b) => isArraysEqual(a, b) }),
    });

    this.getExternalUserProviderStatus = new SyncExecutor();
  }
}
