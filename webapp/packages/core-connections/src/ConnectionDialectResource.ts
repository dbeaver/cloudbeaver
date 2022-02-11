/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  ResourceKeyUtils,
  CachedMapAllKey,
  resourceKeyList,
  SqlDialectInfo
} from '@cloudbeaver/core-sdk';

import type { IConnectionExecutionContextInfo } from './ConnectionExecutionContext/IConnectionExecutionContextInfo';
import { ConnectionInfoResource } from './ConnectionInfoResource';

export type ConnectionDialect = SqlDialectInfo;

@injectable()
export class ConnectionDialectResource extends CachedMapResource<string, ConnectionDialect> {
  constructor(
    private readonly graphQLService: GraphQLService,
    connectionInfoResource: ConnectionInfoResource,
  ) {
    super();
    this.sync(connectionInfoResource);
    this.addAlias(CachedMapAllKey, () => resourceKeyList(connectionInfoResource.keys));
    this.before(ExecutorInterrupter.interrupter(key => !connectionInfoResource.isConnected(key)));
  }

  async formatScript(context: IConnectionExecutionContextInfo, query: string): Promise<string> {
    const result = await this.graphQLService.sdk.formatSqlQuery({
      connectionId: context.connectionId,
      contextId: context.id,
      query,
    });

    return result.query;
  }

  async loadAll(): Promise<Map<string, ConnectionDialect>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  protected async loader(key: ResourceKey<string>, includes: string[]): Promise<Map<string, ConnectionDialect>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    const dialects: Map<string, ConnectionDialect> = new Map();

    await ResourceKeyUtils.forEachAsync(key, async key => {
      const connectionId = key;

      const { dialect } = await this.graphQLService.sdk.querySqlDialectInfo({
        connectionId,
        ...this.getIncludesMap(connectionId, includes),
      });

      if (!dialect) {
        throw new Error('Dialect not found');
      }

      dialects.set(connectionId, dialect);
    });

    runInAction(() => {
      if (all) {
        this.resetIncludes();
        this.data.clear();
      }

      for (const [connectionId, dialect] of dialects) {
        this.dataSet(connectionId, dialect);
      }
    });

    return this.data;
  }
}
