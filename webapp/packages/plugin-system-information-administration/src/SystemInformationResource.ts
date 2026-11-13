/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export class SystemInformationResourceImpl extends CachedDataResource<IObjectPropertyInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);
    this.sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  protected async loader(): Promise<IObjectPropertyInfo[]> {
    const { info } = await this.graphQLService.sdk.getSystemInfo();
    return info;
  }
}

export type SystemInformationResource = SystemInformationResourceImpl;

export class SystemInformationResourceDI extends Context.Service<SystemInformationResourceDI, SystemInformationResourceImpl>()(
  '@cloudbeaver/plugin-system-information-administration/SystemInformationResource#SystemInformationResource',
) {
  static readonly implementation = SystemInformationResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    SystemInformationResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeSystemInformationResource() {
    const graphQLService = yield* GraphQLService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new SystemInformationResourceImpl(graphQLService, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    SystemInformationResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SystemInformationResource = SystemInformationResourceDI;
