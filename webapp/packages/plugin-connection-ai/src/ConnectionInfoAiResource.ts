/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction, toJS } from 'mobx';

import {
  CONNECTION_INFO_PARAM_SCHEMA,
  ConnectionInfoResource,
  isConnectionInfoParamEqual,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import {
  CachedMapResource,
  ResourceKeyUtils,
  isResourceAlias,
  resourceKeyList,
  type ResourceKey,
  type ResourceKeySimple,
} from '@cloudbeaver/core-resource';
import { GraphQLService, type AiDataSourceSettingsInput, type ConnectionInfoAiSettingsFragment } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

export type ConnectionInfoAiSettings = ConnectionInfoAiSettingsFragment;

export class ConnectionInfoAiResourceImpl extends CachedMapResource<IConnectionInfoParams, ConnectionInfoAiSettings> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.sync(this.connectionInfoResource);
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  async save(key: ResourceKeySimple<IConnectionInfoParams>, settings: AiDataSourceSettingsInput): Promise<void> {
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

export type ConnectionInfoAiResource = ConnectionInfoAiResourceImpl;

export class ConnectionInfoAiResourceDI extends Context.Service<ConnectionInfoAiResourceDI, ConnectionInfoAiResourceImpl>()(
  '@cloudbeaver/plugin-connection-ai/ConnectionInfoAiResource#ConnectionInfoAiResource',
) {
  static readonly implementation = ConnectionInfoAiResourceImpl;

  static readonly dependencies = () => [GraphQLService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    ConnectionInfoAiResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeConnectionInfoAiResource() {
    const graphQLService = yield* GraphQLService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new ConnectionInfoAiResourceImpl(graphQLService, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    ConnectionInfoAiResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionInfoAiResource = ConnectionInfoAiResourceDI;
