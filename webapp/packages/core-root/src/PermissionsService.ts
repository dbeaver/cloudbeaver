/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { CachedResource } from '@cloudbeaver/core-resource';

import { ServerConfigResource } from './ServerConfigResource.js';
import { ServerLicenseStatusResource } from './ServerLicenseStatusResource.js';
import { SessionPermissionsResource } from './SessionPermissionsResource.js';

export enum EPermission {}

export class PermissionsServiceImpl {
  get publicDisabled(): boolean {
    return (
      this.serverConfigResource.configurationMode ||
      (this.serverLicenseStatusResource?.licenseRequired && !this.serverLicenseStatusResource.licenseValid)
    );
  }

  constructor(
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly serverLicenseStatusResource: ServerLicenseStatusResource,
  ) {}

  requirePublic<T>(resource: CachedResource<any, any, T, any, any>, map?: (param: void) => T): this {
    resource.preloadResource(this.serverLicenseStatusResource, () => {}).before(ExecutorInterrupter.interrupter(() => this.publicDisabled));

    this.serverLicenseStatusResource.outdateResource<T>(resource, map as any);

    return this;
  }

  has(id: string): boolean {
    return this.sessionPermissionsResource.has(id);
  }

  async hasAsync(id: string): Promise<boolean> {
    return this.sessionPermissionsResource.hasAsync(id);
  }

  async update(): Promise<void> {
    await this.sessionPermissionsResource.refresh();
  }
}

export type PermissionsService = PermissionsServiceImpl;

export class PermissionsServiceDI extends Context.Service<PermissionsServiceDI, PermissionsServiceImpl>()(
  '@cloudbeaver/core-root/PermissionsService#PermissionsService',
) {
  static readonly implementation = PermissionsServiceImpl;

  static readonly dependencies = () => [SessionPermissionsResource, ServerConfigResource, ServerLicenseStatusResource] as const;
  static readonly make: Effect.Effect<
    PermissionsServiceImpl,
    never,
    | Context.Service.Identifier<typeof SessionPermissionsResource>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ServerLicenseStatusResource>
  > = Effect.gen(function* makePermissionsService() {
    const sessionPermissionsResource = yield* SessionPermissionsResource;
    const serverConfigResource = yield* ServerConfigResource;
    const serverLicenseStatusResource = yield* ServerLicenseStatusResource;

    return new PermissionsServiceImpl(sessionPermissionsResource, serverConfigResource, serverLicenseStatusResource);
  });
  static readonly layer: Layer.Layer<
    PermissionsServiceDI,
    never,
    | Context.Service.Identifier<typeof SessionPermissionsResource>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ServerLicenseStatusResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PermissionsService = PermissionsServiceDI;
