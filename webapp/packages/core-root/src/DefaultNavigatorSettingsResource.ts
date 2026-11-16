/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { type DefaultNavigatorSettingsFragment, GraphQLService, type NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type DefaultNavigatorSettings = DefaultNavigatorSettingsFragment['defaultNavigatorSettings'];

export class DefaultNavigatorSettingsResourceImpl extends CachedDataResource<DefaultNavigatorSettings | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  async save(settings: NavigatorSettingsInput): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.setDefaultNavigatorSettings({ settings });
      this.setData(await this.loader());
      this.onDataOutdated.execute();
    });
  }

  protected async loader(): Promise<DefaultNavigatorSettings> {
    const { defaultNavigatorSettings } = await this.graphQLService.sdk.getDefaultNavigatorSettings();
    return defaultNavigatorSettings.defaultNavigatorSettings;
  }
}

export type DefaultNavigatorSettingsResource = DefaultNavigatorSettingsResourceImpl;

export class DefaultNavigatorSettingsResourceDI extends Context.Service<DefaultNavigatorSettingsResourceDI, DefaultNavigatorSettingsResourceImpl>()(
  '@cloudbeaver/core-root/DefaultNavigatorSettingsResource#DefaultNavigatorSettingsResource',
) {
  static readonly implementation = DefaultNavigatorSettingsResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    DefaultNavigatorSettingsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeDefaultNavigatorSettingsResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new DefaultNavigatorSettingsResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    DefaultNavigatorSettingsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DefaultNavigatorSettingsResource = DefaultNavigatorSettingsResourceDI;
