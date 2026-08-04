/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction, toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapResource,
  isResourceAlias,
  type ResourceKey,
  resourceKeyList,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { schemaValidationError } from '@cloudbeaver/core-utils';
import {
  CONNECTION_INFO_PARAM_SCHEMA,
  isConnectionInfoParamEqual,
  ConnectionInfoResource,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { GraphQLService, type ConnectionInfoAiSettingsFragment } from '@cloudbeaver/core-sdk';

export type ConnectionInfoAiSettings = ConnectionInfoAiSettingsFragment;

@injectable(() => [GraphQLService, ConnectionInfoResource])
export class ConnectionInfoAiResource extends CachedMapResource<IConnectionInfoParams, ConnectionInfoAiSettings> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.sync(this.connectionInfoResource);
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  async save(key: ResourceKeySimple<IConnectionInfoParams>, settings: ConnectionInfoAiSettings): Promise<void> {
    await this.performUpdate(key, undefined, async () => {
      await ResourceKeyUtils.forEachAsync(key, async dataSourceId => {
        const result = await this.graphQLService.sdk.saveUserConnectionAiSettings({
          dataSourceId,
          settings,
        });
        this.set(dataSourceId, result.settings);
      });
    });
  }

  protected async loader(originalKey: ResourceKey<IConnectionInfoParams>): Promise<Map<IConnectionInfoParams, ConnectionInfoAiSettings>> {
    const connectionsList: [IConnectionInfoParams, ConnectionInfoAiSettings][] = [];

    if (isResourceAlias(originalKey)) {
      throw new Error('Resource alias is not supported');
    }

    await ResourceKeyUtils.forEachAsync(originalKey, async dataSourceId => {
      const { settings } = await this.graphQLService.sdk.getUserConnectionAiSettings({
        dataSourceId,
      });

      connectionsList.push([dataSourceId, settings]);
    });

    runInAction(() => {
      const keys = resourceKeyList(connectionsList.map(([key]) => key));
      this.set(
        keys,
        connectionsList.map(([, value]) => value),
      );
    });

    return this.data;
  }

  override isKeyEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(param, second);
  }

  protected validateKey(key: IConnectionInfoParams): boolean {
    const parse = CONNECTION_INFO_PARAM_SCHEMA.safeParse(toJS(key));
    if (!parse.success) {
      this.logger.warn(`Invalid resource key ${(schemaValidationError(parse.error).toString(), { prefix: null })}`);
    }
    return parse.success;
  }
}
