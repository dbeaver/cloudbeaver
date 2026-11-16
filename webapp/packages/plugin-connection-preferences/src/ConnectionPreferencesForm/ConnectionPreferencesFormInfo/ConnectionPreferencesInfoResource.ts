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
  ConnectionInfoActiveProjectKey,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  type IConnectionInfoParams,
  isConnectionInfoParamEqual,
  parseConnectionKey,
} from '@cloudbeaver/core-connections';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type DatabaseConnectionPreferencesInfoFragment, GraphQLService } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

export type ConnectionPreferencesInfo = DatabaseConnectionPreferencesInfoFragment;

export class ConnectionPreferencesInfoResourceImpl extends CachedMapResource<IConnectionInfoParams, ConnectionPreferencesInfo> {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.aliases.add(ConnectionInfoProjectKey, param => resourceKeyList(this.keys.filter(key => param.options.projectIds.includes(key.projectId))));

    this.aliases.add(ConnectionInfoActiveProjectKey, () =>
      resourceKeyList(this.keys.filter(key => projectsService.activeProjects.some(({ id }) => id === key.projectId))),
    );

    this.sync(this.connectionInfoResource);
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(
    originalKey: ResourceKey<IConnectionInfoParams>,
    _: any,
    refresh?: boolean,
  ): Promise<Map<IConnectionInfoParams, ConnectionPreferencesInfo>> {
    const connectionsList: ConnectionPreferencesInfo[] = [];
    let removedConnections: IConnectionInfoParams[] = [];
    const parsed = parseConnectionKey({
      originalKey,
      aliases: this.aliases,
      isOutdated: this.isOutdated.bind(this),
      activeProjects: this.projectsService.activeProjects,
      refresh,
    });

    let { projectId } = parsed;
    const { projectIds, key } = parsed;

    await ResourceKeyUtils.forEachAsync(key, async connectionKey => {
      let connectionId: string | undefined;

      if (!isResourceAlias(connectionKey)) {
        projectId = connectionKey.projectId;
        connectionId = connectionKey.connectionId;
      }

      const { connections } = await this.graphQLService.sdk.getUserConnectionsPreferencesInfo({
        projectId,
        connectionId,
        projectIds,
      });

      if (connectionId && !connections.some(connection => connection.id === connectionId)) {
        throw new Error(`Connection is not found (${connectionId})`);
      }

      connectionsList.push(...connections);
    });

    runInAction(() => {
      if (isResourceAlias(key)) {
        removedConnections = ResourceKeyUtils.toList(this.aliases.transformToKey(key)).filter(
          filterKey => !connectionsList.some(connection => isConnectionInfoParamEqual(filterKey, createConnectionParam(connection))),
        );
      }

      this.delete(resourceKeyList(removedConnections));
      const keys = resourceKeyList(connectionsList.map(createConnectionParam));
      this.set(keys, connectionsList);
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

export type ConnectionPreferencesInfoResource = ConnectionPreferencesInfoResourceImpl;

export class ConnectionPreferencesInfoResourceDI extends Context.Service<
  ConnectionPreferencesInfoResourceDI,
  ConnectionPreferencesInfoResourceImpl
>()(
  '@cloudbeaver/plugin-connection-preferences/ConnectionPreferencesForm/ConnectionPreferencesFormInfo/ConnectionPreferencesInfoResource#ConnectionPreferencesInfoResource',
) {
  static readonly implementation = ConnectionPreferencesInfoResourceImpl;

  static readonly dependencies = () => [ProjectsService, GraphQLService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    ConnectionPreferencesInfoResourceImpl,
    never,
    | Context.Service.Identifier<typeof ProjectsService>
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeConnectionPreferencesInfoResource() {
    const projectsService = yield* ProjectsService;
    const graphQLService = yield* GraphQLService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new ConnectionPreferencesInfoResourceImpl(projectsService, graphQLService, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    ConnectionPreferencesInfoResourceDI,
    never,
    | Context.Service.Identifier<typeof ProjectsService>
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionPreferencesInfoResource = ConnectionPreferencesInfoResourceDI;
