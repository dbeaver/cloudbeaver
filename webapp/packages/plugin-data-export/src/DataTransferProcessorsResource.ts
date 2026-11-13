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
import { type DataTransferProcessorInfo, GraphQLService, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export interface IDataTransferProcessorInfo extends DataTransferProcessorInfo {
  properties?: IObjectPropertyInfo[];
}

export class DataTransferProcessorsResourceImpl extends CachedMapResource<string, IDataTransferProcessorInfo> {
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

  protected async loader(): Promise<Map<string, IDataTransferProcessorInfo>> {
    const { processors } = await this.graphQLService.sdk.getDataTransferProcessors();

    this.replace(resourceKeyList(processors.map(processor => processor.id)), processors);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type DataTransferProcessorsResource = DataTransferProcessorsResourceImpl;

export class DataTransferProcessorsResourceDI extends Context.Service<DataTransferProcessorsResourceDI, DataTransferProcessorsResourceImpl>()(
  '@cloudbeaver/plugin-data-export/DataTransferProcessorsResource#DataTransferProcessorsResource',
) {
  static readonly implementation = DataTransferProcessorsResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    DataTransferProcessorsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeDataTransferProcessorsResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new DataTransferProcessorsResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    DataTransferProcessorsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataTransferProcessorsResource = DataTransferProcessorsResourceDI;
