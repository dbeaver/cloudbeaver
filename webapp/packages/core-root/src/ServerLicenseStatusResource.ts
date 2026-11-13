/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ServerLicenseStatusFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type ServerLicenseStatus = ServerLicenseStatusFragment;

export class ServerLicenseStatusResourceImpl extends CachedDataResource<ServerLicenseStatus | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  get licenseRequired(): boolean {
    return this.data?.licenseRequired ?? false;
  }

  get licenseValid(): boolean {
    return this.data?.licenseValid ?? false;
  }

  protected async loader(): Promise<ServerLicenseStatus> {
    const { licenseStatus } = await this.graphQLService.sdk.getServerLicenseStatus();

    return licenseStatus;
  }
}

export type ServerLicenseStatusResource = ServerLicenseStatusResourceImpl;

export class ServerLicenseStatusResourceDI extends Context.Service<ServerLicenseStatusResourceDI, ServerLicenseStatusResourceImpl>()(
  '@cloudbeaver/core-root/ServerLicenseStatusResource#ServerLicenseStatusResource',
) {
  static readonly implementation = ServerLicenseStatusResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    ServerLicenseStatusResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeServerLicenseStatusResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new ServerLicenseStatusResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    ServerLicenseStatusResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerLicenseStatusResource = ServerLicenseStatusResourceDI;
