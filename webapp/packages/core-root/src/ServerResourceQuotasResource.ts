/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ResourceQuotasFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type ServerResourceQuotas = ResourceQuotasFragment['resourceQuotas'];

export class ServerResourceQuotasResourceImpl extends CachedDataResource<ServerResourceQuotas | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  protected async loader(): Promise<ResourceQuotasFragment> {
    const { resourceQuotas } = await this.graphQLService.sdk.getServerResourceQuotas();

    return resourceQuotas.resourceQuotas;
  }
}

export type ServerResourceQuotasResource = ServerResourceQuotasResourceImpl;

export class ServerResourceQuotasResourceDI extends Context.Service<ServerResourceQuotasResourceDI, ServerResourceQuotasResourceImpl>()(
  '@cloudbeaver/core-root/ServerResourceQuotasResource#ServerResourceQuotasResource',
) {
  static readonly implementation = ServerResourceQuotasResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    ServerResourceQuotasResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeServerResourceQuotasResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new ServerResourceQuotasResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    ServerResourceQuotasResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerResourceQuotasResource = ServerResourceQuotasResourceDI;
