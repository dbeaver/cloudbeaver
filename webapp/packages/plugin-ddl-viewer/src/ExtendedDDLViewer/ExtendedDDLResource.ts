/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { CachedMapResource, ResourceKeyUtils, isResourceAlias, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

export class ExtendedDDLResourceImpl extends CachedMapResource<string, string> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();

    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, string>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases not supported by this resource.');
    }

    const values: string[] = [];

    await ResourceKeyUtils.forEachAsync(key, async nodeId => {
      const { metadataGetNodeExtendedDDL } = await this.graphQLService.sdk.metadataGetNodeExtendedDDL({ nodeId });

      if (metadataGetNodeExtendedDDL) {
        values.push(metadataGetNodeExtendedDDL);
      }
    });

    this.set(ResourceKeyUtils.toList(key), values);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type ExtendedDDLResource = ExtendedDDLResourceImpl;

export class ExtendedDDLResourceDI extends Context.Service<ExtendedDDLResourceDI, ExtendedDDLResourceImpl>()(
  '@cloudbeaver/plugin-ddl-viewer/ExtendedDDLViewer/ExtendedDDLResource#ExtendedDDLResource',
) {
  static readonly implementation = ExtendedDDLResourceImpl;

  static readonly dependencies = () => [GraphQLService, NavNodeInfoResource] as const;
  static readonly make: Effect.Effect<
    ExtendedDDLResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Effect.gen(function* makeExtendedDDLResource() {
    const graphQLService = yield* GraphQLService;
    const navNodeInfoResource = yield* NavNodeInfoResource;

    return new ExtendedDDLResourceImpl(graphQLService, navNodeInfoResource);
  });
  static readonly layer: Layer.Layer<
    ExtendedDDLResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ExtendedDDLResource = ExtendedDDLResourceDI;
