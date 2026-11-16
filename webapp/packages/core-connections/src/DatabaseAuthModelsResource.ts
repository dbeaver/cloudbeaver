/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type DatabaseAuthModel as DatabaseAuthModelBase, GraphQLService } from '@cloudbeaver/core-sdk';

export type DatabaseAuthModel = DatabaseAuthModelBase;

export class DatabaseAuthModelsResourceImpl extends CachedMapResource<string, DatabaseAuthModel> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super();
    this.sync(
      serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );
  }

  protected async loader(): Promise<Map<string, DatabaseAuthModel>> {
    const { models } = await this.graphQLService.sdk.getAuthModels();

    this.replace(resourceKeyList(models.map(model => model.id)), models);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type DatabaseAuthModelsResource = DatabaseAuthModelsResourceImpl;

export class DatabaseAuthModelsResourceDI extends Context.Service<DatabaseAuthModelsResourceDI, DatabaseAuthModelsResourceImpl>()(
  '@cloudbeaver/core-connections/DatabaseAuthModelsResource#DatabaseAuthModelsResource',
) {
  static readonly implementation = DatabaseAuthModelsResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    DatabaseAuthModelsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeDatabaseAuthModelsResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new DatabaseAuthModelsResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    DatabaseAuthModelsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DatabaseAuthModelsResource = DatabaseAuthModelsResourceDI;
