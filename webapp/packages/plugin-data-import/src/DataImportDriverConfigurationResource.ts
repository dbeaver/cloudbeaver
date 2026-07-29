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
  createConnectionParam,
  type IConnectionInfoParams,
  isConnectionInfoParamEqual,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type DriverConfigurationFragment, type GetConnectionImportDriverConfigurationQuery, GraphQLService } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

export type IDataImportDriverConfiguration = DriverConfigurationFragment;

@injectable(() => [GraphQLService, ConnectionInfoResource])
export class DataImportDriverConfigurationResource extends CachedMapResource<IConnectionInfoParams, IDataImportDriverConfiguration> {
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

  protected async loader(originalKey: ResourceKey<IConnectionInfoParams>): Promise<Map<IConnectionInfoParams, IDataImportDriverConfiguration>> {
    if (isResourceAlias(originalKey)) {
      throw new Error('Aliases are not supported by this resource');
    }

    const connectionsList: GetConnectionImportDriverConfigurationQuery['connections'] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      if (!this.connectionInfoResource.isConnected(key)) {
        throw new Error(`Connection is not connected (${key.projectId}, ${key.connectionId})`);
      }

      const { connections } = await this.graphQLService.sdk.getConnectionImportDriverConfiguration({
        projectId: key.projectId,
        connectionId: key.connectionId,
      });

      if (!connections.some(connection => connection.id === key.connectionId)) {
        throw new Error(`Connection is not found (${key.connectionId})`);
      }

      connectionsList.push(...connections);
    });

    this.set(
      resourceKeyList(connectionsList.map(createConnectionParam)),
      connectionsList.map(connection => connection.driverConfiguration),
    );

    return this.data;
  }

  protected validateKey(key: IConnectionInfoParams): boolean {
    const parse = CONNECTION_INFO_PARAM_SCHEMA.safeParse(toJS(key));
    if (!parse.success) {
      this.logger.warn(`Invalid resource key ${schemaValidationError(parse.error).toString()}`);
    }
    return parse.success;
  }
}
