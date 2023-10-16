/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import { externalUserProviderStatusContext } from './externalUserProviderStatusContext';

@injectable()
export class AdministrationUsersManagementService {
  get externalUserProviderEnabled(): boolean {
    const contexts = this.getExternalUserProviderStatus.execute();
    const projectsContext = contexts.getContext(externalUserProviderStatusContext);

    return projectsContext.externalUserProviderEnabled;
  }
  readonly getExternalUserProviderStatus: ISyncExecutor;

  constructor() {
    makeObservable(this, {
      externalUserProviderEnabled: computed,
    });

    this.getExternalUserProviderStatus = new SyncExecutor();
  }
}
