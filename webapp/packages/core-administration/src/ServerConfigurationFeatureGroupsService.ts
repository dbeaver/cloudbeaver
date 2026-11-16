/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class ServerConfigurationFeatureGroupsServiceImpl {
  readonly featureGroups = new Map<string, string>();

  constructor() {
    makeObservable(this, {
      featureGroups: observable.shallow,
    });
  }

  assignFeaturesToGroup(groupId: string, featureIds: readonly string[]): void {
    for (const featureId of featureIds) {
      this.featureGroups.set(featureId, groupId);
    }
  }
}

export type ServerConfigurationFeatureGroupsService = ServerConfigurationFeatureGroupsServiceImpl;

export class ServerConfigurationFeatureGroupsServiceDI extends Context.Service<
  ServerConfigurationFeatureGroupsServiceDI,
  ServerConfigurationFeatureGroupsServiceImpl
>()('@cloudbeaver/core-administration/ServerConfigurationFeatureGroupsService#ServerConfigurationFeatureGroupsService') {
  static readonly implementation = ServerConfigurationFeatureGroupsServiceImpl;
  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<ServerConfigurationFeatureGroupsServiceImpl, never, never> = Effect.sync(
    () => new ServerConfigurationFeatureGroupsServiceImpl(),
  );
  static readonly layer: Layer.Layer<ServerConfigurationFeatureGroupsServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerConfigurationFeatureGroupsService = ServerConfigurationFeatureGroupsServiceDI;
