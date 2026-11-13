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
import { type DataTransferProcessorInfo, GraphQLService } from '@cloudbeaver/core-sdk';

export class DataImportProcessorsResourceImpl extends CachedMapResource<string, DataTransferProcessorInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => new Map());
    this.sync(
      serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );
  }

  protected async loader(): Promise<Map<string, DataTransferProcessorInfo>> {
    const { processors } = await this.graphQLService.sdk.getDataTransferImportProcessors();

    this.replace(resourceKeyList(processors.map(processor => processor.id)), processors);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type DataImportProcessorsResource = DataImportProcessorsResourceImpl;

export class DataImportProcessorsResourceDI extends Context.Service<DataImportProcessorsResourceDI, DataImportProcessorsResourceImpl>()(
  '@cloudbeaver/plugin-data-import/DataImportProcessorsResource#DataImportProcessorsResource',
) {
  static readonly implementation = DataImportProcessorsResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    DataImportProcessorsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeDataImportProcessorsResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new DataImportProcessorsResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    DataImportProcessorsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataImportProcessorsResource = DataImportProcessorsResourceDI;
