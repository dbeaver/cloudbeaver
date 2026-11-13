/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ProductSettings } from '@cloudbeaver/core-sdk';

import { SessionDataResource } from '../SessionDataResource.js';

export type ServerSettings = ProductSettings;

export class ServerSettingsResourceImpl extends CachedDataResource<ServerSettings | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
  ) {
    super(() => null, undefined, []);
    this.sync(sessionDataResource);
  }

  protected async loader(): Promise<ServerSettings> {
    const { settings } = await this.graphQLService.sdk.getProductSettings();
    return settings as ServerSettings;
  }
}

export type ServerSettingsResource = ServerSettingsResourceImpl;

export class ServerSettingsResourceDI extends Context.Service<ServerSettingsResourceDI, ServerSettingsResourceImpl>()(
  '@cloudbeaver/core-root/Settings/ServerSettingsResource#ServerSettingsResource',
) {
  static readonly implementation = ServerSettingsResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionDataResource] as const;
  static readonly make: Effect.Effect<
    ServerSettingsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionDataResource>
  > = Effect.gen(function* makeServerSettingsResource() {
    const graphQLService = yield* GraphQLService;
    const sessionDataResource = yield* SessionDataResource;

    return new ServerSettingsResourceImpl(graphQLService, sessionDataResource);
  });
  static readonly layer: Layer.Layer<
    ServerSettingsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionDataResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerSettingsResource = ServerSettingsResourceDI;
