/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  CONNECTION_INFO_PARAM_SCHEMA,
  ConnectionInfoResource,
  isConnectionInfoParamEqual,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { CachedMapResource, ResourceKeyUtils, isResourceAlias, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService, type GetUserConnectionAiScopeQuery } from '@cloudbeaver/core-sdk';
import { toJS } from 'mobx';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';

export type ConnectionInfoAiScope = GetUserConnectionAiScopeQuery['scope'];

export class ConnectionInfoAiScopeResourceImpl extends CachedMapResource<IConnectionInfoParams, ConnectionInfoAiScope> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    connectionInfoAiResource: ConnectionInfoAiResource,
  ) {
    super();
    this.sync(connectionInfoAiResource);
    this.before(ExecutorInterrupter.interrupter(key => !this.connectionInfoResource.isConnected(key)));
    connectionInfoAiResource.onDataUpdate.addHandler(this.markOutdated.bind(this));
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(key: ResourceKey<IConnectionInfoParams>): Promise<Map<IConnectionInfoParams, ConnectionInfoAiScope>> {
    if (isResourceAlias(key)) {
      throw new Error('Resource alias is not supported');
    }

    await ResourceKeyUtils.forEachAsync(key, async dataSourceId => {
      const { scope } = await this.graphQLService.sdk.getUserConnectionAiScope({ dataSourceId });
      this.set(dataSourceId, scope);
    });

    return this.data;
  }

  override isKeyEqual(first: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(first, second);
  }

  protected validateKey(key: IConnectionInfoParams): boolean {
    return CONNECTION_INFO_PARAM_SCHEMA.safeParse(toJS(key)).success;
  }
}

export type ConnectionInfoAiScopeResource = ConnectionInfoAiScopeResourceImpl;

export class ConnectionInfoAiScopeResourceDI extends Context.Service<ConnectionInfoAiScopeResourceDI, ConnectionInfoAiScopeResourceImpl>()(
  '@cloudbeaver/plugin-connection-ai/ConnectionInfoAiScopeResource#ConnectionInfoAiScopeResource',
) {
  static readonly implementation = ConnectionInfoAiScopeResourceImpl;

  static readonly dependencies = () => [GraphQLService, ConnectionInfoResource, ConnectionInfoAiResource] as const;
  static readonly make: Effect.Effect<
    ConnectionInfoAiScopeResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof ConnectionInfoAiResource>
  > = Effect.gen(function* makeConnectionInfoAiScopeResource() {
    const graphQLService = yield* GraphQLService;
    const connectionInfoResource = yield* ConnectionInfoResource;
    const connectionInfoAiResource = yield* ConnectionInfoAiResource;

    return new ConnectionInfoAiScopeResourceImpl(graphQLService, connectionInfoResource, connectionInfoAiResource);
  });
  static readonly layer: Layer.Layer<
    ConnectionInfoAiScopeResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof ConnectionInfoAiResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionInfoAiScopeResource = ConnectionInfoAiScopeResourceDI;
