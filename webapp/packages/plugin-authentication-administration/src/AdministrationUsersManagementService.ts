/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { type ILoadableState, isArraysEqual } from '@cloudbeaver/core-utils';

import { externalUserProviderStatusContext } from './externalUserProviderStatusContext.js';

export class AdministrationUsersManagementServiceImpl {
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

export type AdministrationUsersManagementService = AdministrationUsersManagementServiceImpl;

export class AdministrationUsersManagementServiceDI extends Context.Service<
  AdministrationUsersManagementServiceDI,
  AdministrationUsersManagementServiceImpl
>()('@cloudbeaver/plugin-authentication-administration/AdministrationUsersManagementService#AdministrationUsersManagementService') {
  static readonly implementation = AdministrationUsersManagementServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<AdministrationUsersManagementServiceImpl, never, never> = Effect.sync(
    () => new AdministrationUsersManagementServiceImpl(),
  );
  static readonly layer: Layer.Layer<AdministrationUsersManagementServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AdministrationUsersManagementService = AdministrationUsersManagementServiceDI;
