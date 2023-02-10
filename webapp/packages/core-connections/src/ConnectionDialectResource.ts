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
  SqlDialectInfo,
  isResourceKeyList
} from '@cloudbeaver/core-sdk';

import type { IConnectionExecutionContextInfo } from './ConnectionExecutionContext/IConnectionExecutionContextInfo';
import { ConnectionInfoResource, isConnectionInfoParamEqual } from './ConnectionInfoResource';
import type { IConnectionInfoParams } from './IConnectionsResource';

export type ConnectionDialect = SqlDialectInfo;

@injectable()
export class ConnectionDialectResource extends CachedMapResource<IConnectionInfoParams, ConnectionDialect> {
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

  async loadAll(): Promise<Map<IConnectionInfoParams, ConnectionDialect>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  protected async loader(
    key: ResourceKey<IConnectionInfoParams>,
    includes: string[]
  ): Promise<Map<IConnectionInfoParams, ConnectionDialect>> {
    const all = this.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    const dialects: Map<IConnectionInfoParams, ConnectionDialect> = new Map();

    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { dialect } = await this.graphQLService.sdk.querySqlDialectInfo({
        ...key,
        ...this.getIncludesMap(key, includes),
      });

      if (!dialect) {
        throw new Error('Dialect not found');
      }

      dialects.set(key, dialect);
    });

    runInAction(() => {
      if (all) {
        this.resetIncludes();
        this.clear();
      }

      for (const [key, dialect] of dialects) {
        this.dataSet(key, dialect);
      }
    });

    return this.data;
  }

  isKeyEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(param, second);
  }

  protected validateParam(param: ResourceKey<IConnectionInfoParams>): boolean {
    return (
      super.validateParam(param)
      || (
        typeof param === 'object' && !isResourceKeyList(param)
        && typeof param.projectId === 'string'
        && ['string'].includes(typeof param.connectionId)
      )
    );
  }
}
