/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ServerConfigurationFeatureGroupsService } from '@cloudbeaver/core-administration';
import { ConnectionTypeResource, FEATURE_GROUP_CONNECTIONS_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { FEATURE_RESET_CREDENTIALS_ON_TARGET_CHANGE_ID } from './FEATURE_RESET_CREDENTIALS_ON_TARGET_CHANGE_ID.js';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly serverConfigurationFeatureGroupsService: ServerConfigurationFeatureGroupsService) {
    super();
  }

  override register(): void {
    this.serverConfigurationFeatureGroupsService.assignFeaturesToGroup(FEATURE_GROUP_CONNECTIONS_ID, [FEATURE_RESET_CREDENTIALS_ON_TARGET_CHANGE_ID]);
  }

  override async load(): Promise<void> {}
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-connections/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;
  static readonly dependencies = () => [ServerConfigurationFeatureGroupsService, ConnectionTypeResource] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    Context.Service.Identifier<typeof ServerConfigurationFeatureGroupsService> | Context.Service.Identifier<typeof ConnectionTypeResource>
  > = Effect.gen(function* makePluginBootstrap() {
    const serverConfigurationFeatureGroupsService = yield* ServerConfigurationFeatureGroupsService;
    yield* ConnectionTypeResource;
    return new PluginBootstrapImpl(serverConfigurationFeatureGroupsService);
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    Context.Service.Identifier<typeof ServerConfigurationFeatureGroupsService> | Context.Service.Identifier<typeof ConnectionTypeResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
