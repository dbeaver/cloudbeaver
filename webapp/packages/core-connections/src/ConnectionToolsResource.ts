/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type DatabaseConnectionToolsFragment, GraphQLService } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

import { CONNECTION_INFO_PARAM_SCHEMA, type IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionInfoResource, createConnectionParam, isConnectionInfoParamEqual } from './ConnectionInfoResource.js';

export type ConnectionTools = DatabaseConnectionToolsFragment;

@injectable()
export class ConnectionToolsResource extends CachedMapResource<IConnectionInfoParams, ConnectionTools> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.sync(connectionInfoResource);
    connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  override isKeyEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(param, second);
  }

  protected async loader(originalKey: ResourceKey<IConnectionInfoParams>): Promise<Map<IConnectionInfoParams, ConnectionTools>> {
    const connectionsList: ConnectionTools[] = [];

    if (isResourceAlias(originalKey)) {
      throw new Error('Aliases are not supported');
    }

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const projectId = key.projectId;
      const connectionId = key.connectionId;

      if (!this.connectionInfoResource.isConnected(key)) {
        throw new Error(`Connection is not connected (${projectId}, ${connectionId})`);
      }

      const { connections } = await this.graphQLService.sdk.getConnectionsTools({
        projectId,
        connectionId,
      });

      if (connectionId && !connections.some(connection => connection.id === connectionId)) {
        throw new Error(`Connection is not found (${connectionId})`);
      }

      connectionsList.push(...connections);
    });

    const key = resourceKeyList(connectionsList.map(createConnectionParam));
    this.set(key, connectionsList);

    return this.data;
  }
  protected validateKey(key: IConnectionInfoParams): boolean {
    const parse = CONNECTION_INFO_PARAM_SCHEMA.safeParse(toJS(key));
    if (!parse.success) {
      this.logger.warn(`Invalid resource key ${(schemaValidationError(parse.error).toString(), { prefix: null })}`);
    }
    return parse.success;
  }
}
