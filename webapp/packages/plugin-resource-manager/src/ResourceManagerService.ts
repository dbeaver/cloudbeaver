/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { ProjectInfo } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';

export class ResourceManagerServiceImpl {
  get enabled() {
    return !!this.serverConfigResource.data?.resourceManagerEnabled && this.userInfoResource.isAuthenticated();
  }

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    makeObservable(this, {
      enabled: computed,
    });
  }

  getRootFolder(project: ProjectInfo, resourceTypeId: string): string | undefined {
    const scriptType = project.resourceTypes.find(type => type.id === resourceTypeId);

    return this.serverConfigResource.distributed ? scriptType?.rootFolder : undefined;
  }
}

export type ResourceManagerService = ResourceManagerServiceImpl;

export class ResourceManagerServiceDI extends Context.Service<ResourceManagerServiceDI, ResourceManagerServiceImpl>()(
  '@cloudbeaver/plugin-resource-manager/ResourceManagerService#ResourceManagerService',
) {
  static readonly implementation = ResourceManagerServiceImpl;

  static readonly dependencies = () => [UserInfoResource, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    ResourceManagerServiceImpl,
    never,
    Context.Service.Identifier<typeof UserInfoResource> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeResourceManagerService() {
    const userInfoResource = yield* UserInfoResource;
    const serverConfigResource = yield* ServerConfigResource;

    return new ResourceManagerServiceImpl(userInfoResource, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    ResourceManagerServiceDI,
    never,
    Context.Service.Identifier<typeof UserInfoResource> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResourceManagerService = ResourceManagerServiceDI;
