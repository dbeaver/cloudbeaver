/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { GraphQLService, CachedMapResource, ResourceKey, ResourceKeyUtils, CachedMapAllKey, resourceKeyList, SqlDialectInfo, isResourceKeyList } from '@cloudbeaver/core-sdk';

import type { IConnectionExecutionContextInfo } from './ConnectionExecutionContext/IConnectionExecutionContextInfo';
import { ConnectionInfoActiveProjectKey, ConnectionInfoProjectKey, ConnectionInfoResource, isConnectionInfoParamEqual } from './ConnectionInfoResource';
import type { IConnectionInfoParams } from './IConnectionsResource';

export type ConnectionDialect = SqlDialectInfo;

@injectable()
export class ConnectionDialectResource extends CachedMapResource<IConnectionInfoParams, ConnectionDialect> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly projectsService: ProjectsService,
    connectionInfoResource: ConnectionInfoResource,
  ) {
    super();
    this.sync(connectionInfoResource);
    this.addAlias(
      ConnectionInfoProjectKey,
      param => resourceKeyList(
        connectionInfoResource.keys.filter(key => param.options.projectIds.includes(key.projectId))
      )
    );

    this.addAlias(
      ConnectionInfoActiveProjectKey,
      () => resourceKeyList(
        connectionInfoResource.keys.filter(key => projectsService.activeProjects.some(({ id }) => id === key.projectId))
      )
    );
    this.replaceAlias(CachedMapAllKey, () => resourceKeyList(connectionInfoResource.keys));
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

  protected async loader(
    originalKey: ResourceKey<IConnectionInfoParams>,
    includes: string[]
  ): Promise<Map<IConnectionInfoParams, ConnectionDialect>> {
    const dialects: ConnectionDialect[] = [];
    const keys = ResourceKeyUtils.toList(this.transformToKey(originalKey));

    for (const key of keys) {
      const { dialect } = await this.graphQLService.sdk.querySqlDialectInfo({
        ...key,
        ...this.getIncludesMap(key, includes),
      });

      if (!dialect) {
        throw new Error('Dialect not found');
      }

      dialects.push(dialect);
    }

    this.set(keys, dialects);

    return this.data;
  }

  isKeyEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(param, second);
  }

  protected validateKey(key: IConnectionInfoParams): boolean {
    return (
      typeof key === 'object'
      && typeof key.projectId === 'string'
      && ['string'].includes(typeof key.connectionId)
    );
  }
}
