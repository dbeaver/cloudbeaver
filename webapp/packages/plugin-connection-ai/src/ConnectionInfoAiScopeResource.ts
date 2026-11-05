/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';
import {
  CONNECTION_INFO_PARAM_SCHEMA,
  ConnectionInfoResource,
  isConnectionInfoParamEqual,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { CachedMapResource, isResourceAlias, type ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService, type GetUserConnectionAiScopeQuery } from '@cloudbeaver/core-sdk';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';

export type ConnectionInfoAiScope = GetUserConnectionAiScopeQuery['scope'];

@injectable(() => [GraphQLService, ConnectionInfoResource, ConnectionInfoAiResource])
export class ConnectionInfoAiScopeResource extends CachedMapResource<IConnectionInfoParams, ConnectionInfoAiScope> {
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
