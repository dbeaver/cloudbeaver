/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction, toJS } from 'mobx';

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type DatabaseConnectionPropertiesFragment, GraphQLService } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

import { CONNECTION_INFO_PARAM_SCHEMA, type IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';
import {
  ConnectionInfoActiveProjectKey,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  isConnectionInfoParamEqual,
} from './ConnectionInfoResource.js';
import { parseConnectionKey } from './parseConnectionKey.js';

export type ConnectionInfoProperties = DatabaseConnectionPropertiesFragment;

export class ConnectionInfoPropertiesResourceImpl extends CachedMapResource<IConnectionInfoParams, ConnectionInfoProperties> {
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
  ): Promise<Map<IConnectionInfoParams, ConnectionInfoProperties>> {
    const connectionsList: ConnectionInfoProperties[] = [];
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

      const { connections } = await this.graphQLService.sdk.getUserConnectionsProperties({
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

export type ConnectionInfoPropertiesResource = ConnectionInfoPropertiesResourceImpl;

export class ConnectionInfoPropertiesResourceDI extends Context.Service<ConnectionInfoPropertiesResourceDI, ConnectionInfoPropertiesResourceImpl>()(
  '@cloudbeaver/core-connections/ConnectionInfoPropertiesResource#ConnectionInfoPropertiesResource',
) {
  static readonly implementation = ConnectionInfoPropertiesResourceImpl;

  static readonly dependencies = () => [ProjectsService, GraphQLService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    ConnectionInfoPropertiesResourceImpl,
    never,
    | Context.Service.Identifier<typeof ProjectsService>
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeConnectionInfoPropertiesResource() {
    const projectsService = yield* ProjectsService;
    const graphQLService = yield* GraphQLService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new ConnectionInfoPropertiesResourceImpl(projectsService, graphQLService, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    ConnectionInfoPropertiesResourceDI,
    never,
    | Context.Service.Identifier<typeof ProjectsService>
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionInfoPropertiesResource = ConnectionInfoPropertiesResourceDI;
