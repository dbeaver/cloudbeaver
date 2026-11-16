/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type RmProject } from '@cloudbeaver/core-sdk';

export type Project = Omit<RmProject, 'creator' | 'createTime' | 'canEditConnection' | 'canEditResource'>;

export class ResourceProjectsResourceImpl extends CachedDataResource<Project[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super(() => []);

    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
  }

  protected async loader(): Promise<Project[]> {
    const { projects } = await this.graphQLService.sdk.getResourceProjectList();
    return projects;
  }
}

export type ResourceProjectsResource = ResourceProjectsResourceImpl;

export class ResourceProjectsResourceDI extends Context.Service<ResourceProjectsResourceDI, ResourceProjectsResourceImpl>()(
  '@cloudbeaver/plugin-resource-manager/ResourceProjectsResource#ResourceProjectsResource',
) {
  static readonly implementation = ResourceProjectsResourceImpl;

  static readonly dependencies = () => [GraphQLService, UserInfoResource] as const;
  static readonly make: Effect.Effect<
    ResourceProjectsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Effect.gen(function* makeResourceProjectsResource() {
    const graphQLService = yield* GraphQLService;
    const userInfoResource = yield* UserInfoResource;

    return new ResourceProjectsResourceImpl(graphQLService, userInfoResource);
  });
  static readonly layer: Layer.Layer<
    ResourceProjectsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResourceProjectsResource = ResourceProjectsResourceDI;
