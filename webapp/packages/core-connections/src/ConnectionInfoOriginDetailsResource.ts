/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction, toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapResource, isResourceAlias, ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { DatabaseConnectionOriginDetailsFragment, GraphQLService } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

import { CONNECTION_INFO_PARAM_SCHEMA, IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA';
import {
  ConnectionInfoActiveProjectKey,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  isConnectionInfoParamEqual,
} from './ConnectionInfoResource';

@injectable()
export class ConnectionInfoOriginDetailsResource extends CachedMapResource<IConnectionInfoParams, DatabaseConnectionOriginDetailsFragment> {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.sync(this.connectionInfoResource);
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(
    originalKey: ResourceKey<IConnectionInfoParams>,
    _: any,
    refresh?: boolean,
  ): Promise<Map<IConnectionInfoParams, DatabaseConnectionOriginDetailsFragment>> {
    const connectionsList: DatabaseConnectionOriginDetailsFragment[] = [];
    const projectKey = this.aliases.isAlias(originalKey, ConnectionInfoProjectKey);
    let removedConnections: IConnectionInfoParams[] = [];
    let projectId: string | undefined;
    let projectIds: string[] | undefined;

    if (projectKey) {
      projectIds = projectKey.options.projectIds;
    }

    if (this.aliases.isAlias(originalKey, ConnectionInfoActiveProjectKey)) {
      projectIds = this.projectsService.activeProjects.map(project => project.id);
    }

    if (isResourceAlias(originalKey)) {
      const key = this.aliases.transformToKey(originalKey);
      const outdated = ResourceKeyUtils.filter(key, key => this.isOutdated(key));

      if (!refresh && outdated.length === 1) {
        originalKey = outdated[0]; // load only single connection
      }
    }

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let connectionId: string | undefined;
      if (!isResourceAlias(key)) {
        projectId = key.projectId;
        connectionId = key.connectionId;
      }

      const { connections } = await this.graphQLService.sdk.getUserConnectionsOriginDetails({
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
      if (isResourceAlias(originalKey)) {
        removedConnections = ResourceKeyUtils.toList(this.aliases.transformToKey(originalKey)).filter(
          key => !connectionsList.some(connection => isConnectionInfoParamEqual(key, createConnectionParam(connection))),
        );
      }

      this.delete(resourceKeyList(removedConnections));
      const key = resourceKeyList(connectionsList.map(createConnectionParam));
      this.set(key, connectionsList);
    });

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
