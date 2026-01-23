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
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { schemaValidationError } from '@cloudbeaver/core-utils';
import { GraphQLService, type DatabaseConnectionNavigatorViewSettingsFragment } from '@cloudbeaver/core-sdk';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { DEFAULT_NAVIGATOR_VIEW_SETTINGS, type NavigatorViewSettings } from '@cloudbeaver/core-root';

type NavigatorViewSettingsInfo = DatabaseConnectionNavigatorViewSettingsFragment;

@injectable(() => [GraphQLService, ConnectionInfoResource, ProjectsService])
export class ConnectionViewResource extends CachedMapResource<IConnectionInfoParams, NavigatorViewSettingsInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly projectsService: ProjectsService,
  ) {
    super();

    this.aliases.add(ConnectionInfoProjectKey, param => resourceKeyList(this.keys.filter(key => param.options.projectIds.includes(key.projectId))));

    this.aliases.add(ConnectionInfoActiveProjectKey, () =>
      resourceKeyList(this.keys.filter(key => projectsService.activeProjects.some(({ id }) => id === key.projectId))),
    );

    this.sync(this.connectionInfoResource);
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  async changeConnectionView(key: IConnectionInfoParams, settings: NavigatorViewSettings): Promise<NavigatorViewSettingsInfo> {
    const prev = this.get(key);
    const prevSettings = settings.userSettings ? prev?.navigatorSettings : prev?.defaultNavigatorSettings;
    const current = prevSettings || DEFAULT_NAVIGATOR_VIEW_SETTINGS;

    const { connection } = await this.graphQLService.sdk.setConnectionNavigatorSettings({
      connectionId: key.connectionId,
      projectId: key.projectId,
      settings: { ...current, ...settings },
    });

    this.set(key, connection);
    return this.get(key)!;
  }

  async clearConnectionView(key: IConnectionInfoParams): Promise<NavigatorViewSettingsInfo> {
    const { connection } = await this.graphQLService.sdk.clearConnectionNavigatorSettings({
      id: key.connectionId,
      projectId: key.projectId,
    });

    this.set(key, connection);
    this.onDataOutdated.execute(key);

    return this.get(key)!;
  }

  protected async loader(
    originalKey: ResourceKey<IConnectionInfoParams>,
    _: any,
    refresh?: boolean,
  ): Promise<Map<IConnectionInfoParams, NavigatorViewSettingsInfo>> {
    const connectionsList: NavigatorViewSettingsInfo[] = [];
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

      const { connections } = await this.graphQLService.sdk.getUserConnectionsNavigatorViewSettings({
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
