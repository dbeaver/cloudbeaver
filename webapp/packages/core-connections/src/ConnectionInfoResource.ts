/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';

import { AppAuthService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter, ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { DataSynchronizationService, NavigatorViewSettings, ServerEventId, SessionDataResource } from '@cloudbeaver/core-root';
import {
  AdminConnectionGrantInfo,
  AdminConnectionSearchInfo,
  CachedMapAllKey,
  CachedMapResource,
  CachedResourceIncludeArgs,
  ConnectionConfig,
  GetUserConnectionsQueryVariables,
  GraphQLService,
  InitConnectionMutationVariables,
  isResourceAlias,
  NavigatorSettingsInput,
  ResourceKey,
  resourceKeyList,
  ResourceKeyList,
  resourceKeyListAlias,
  resourceKeyListAliasFactory,
  ResourceKeyUtils,
  TestConnectionMutation,
  UserConnectionAuthPropertiesFragment,
} from '@cloudbeaver/core-sdk';

import { ConnectionInfoEventHandler, IConnectionInfoEvent } from './ConnectionInfoEventHandler';
import type { DatabaseConnection } from './DatabaseConnection';
import type { IConnectionInfoParams } from './IConnectionsResource';

export type Connection = DatabaseConnection & {
  authProperties?: UserConnectionAuthPropertiesFragment[];
};
export type ConnectionInitConfig = Omit<
  InitConnectionMutationVariables,
  | 'includeOrigin'
  | 'customIncludeOriginDetails'
  | 'includeAuthProperties'
  | 'includeNetworkHandlersConfig'
  | 'includeAuthNeeded'
  | 'includeCredentialsSaved'
  | 'includeProperties'
  | 'includeProviderProperties'
  | 'customIncludeOptions'
>;
export type ConnectionInfoIncludes = Omit<GetUserConnectionsQueryVariables, 'id'>;

export const NEW_CONNECTION_SYMBOL = Symbol('new-connection');

export type NewConnection = Connection & { [NEW_CONNECTION_SYMBOL]: boolean; timestamp: number };

export const ConnectionInfoProjectKey = resourceKeyListAliasFactory('@connection-info/projects', (...projectIds: string[]) => ({ projectIds }));

export const ConnectionInfoActiveProjectKey = resourceKeyListAlias('@connection-info/projects-active');

export const DEFAULT_NAVIGATOR_VIEW_SETTINGS: NavigatorSettingsInput = {
  showOnlyEntities: false,
  hideFolders: false,
  hideVirtualModel: false,
  hideSchemas: false,
  mergeEntities: false,
  showSystemObjects: false,
  showUtilityObjects: false,
};

@injectable()
export class ConnectionInfoResource extends CachedMapResource<IConnectionInfoParams, Connection, ConnectionInfoIncludes> {
  readonly onConnectionCreate: ISyncExecutor<Connection>;
  readonly onConnectionClose: ISyncExecutor<Connection>;

  private sessionUpdate: boolean;
  private readonly nodeIdMap: Map<string, IConnectionInfoParams>;
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly projectsService: ProjectsService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly dataSynchronizationService: DataSynchronizationService,
    sessionDataResource: SessionDataResource,
    appAuthService: AppAuthService,
    connectionInfoEventHandler: ConnectionInfoEventHandler,
    userInfoResource: UserInfoResource,
  ) {
    super();

    this.onConnectionCreate = new SyncExecutor();
    this.onConnectionClose = new SyncExecutor();
    this.sessionUpdate = false;
    this.nodeIdMap = new Map();

    this.addAlias(ConnectionInfoProjectKey, param => resourceKeyList(this.keys.filter(key => param.options.projectIds.includes(key.projectId))));

    this.addAlias(ConnectionInfoActiveProjectKey, () =>
      resourceKeyList(this.keys.filter(key => projectsService.activeProjects.some(({ id }) => id === key.projectId))),
    );

    // in case when session was refreshed all data depended on connection info
    // should be refreshed by session update executor
    // it's prevents double nav tree refresh
    // this.onItemUpdate.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));
    this.onItemDelete.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));
    this.onConnectionCreate.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));

    userInfoResource.onUserChange.addHandler(() => {
      this.clear();
    });
    appAuthService.requireAuthentication(this);
    this.sync(
      this.projectInfoResource,
      () => CachedMapAllKey,
      () => CachedMapAllKey,
    );
    this.projectsService.onActiveProjectChange.addHandler(data => {
      if (data.type === 'after') {
        this.markOutdated(ConnectionInfoActiveProjectKey);
      }
    });

    sessionDataResource.onDataOutdated.addHandler(() => {
      this.sessionUpdate = true;
      this.markOutdated();
    });

    connectionInfoEventHandler.onEvent<ResourceKeyList<IConnectionInfoParams>>(
      ServerEventId.CbDatasourceCreated,
      async key => {
        const connections = await this.load(key);

        for (const connection of connections) {
          this.onConnectionCreate.execute(connection);
        }
      },
      data =>
        resourceKeyList(
          data.dataSourceIds.map<IConnectionInfoParams>(connectionId => ({
            projectId: data.projectId,
            connectionId,
          })),
        ),
      this,
    );

    connectionInfoEventHandler.onEvent<ResourceKeyList<IConnectionInfoParams>>(
      ServerEventId.CbDatasourceUpdated,
      key => {
        if (this.isConnected(key)) {
          const connection = this.get(key);

          this.dataSynchronizationService
            .requestSynchronization('connection', connection.map(connection => connection?.name).join('\n'))
            .then(state => {
              if (state) {
                this.markOutdated(key);
              }
            });
        } else {
          this.markOutdated(key);
        }
      },
      data =>
        resourceKeyList(
          data.dataSourceIds.map<IConnectionInfoParams>(connectionId => ({
            projectId: data.projectId,
            connectionId,
          })),
        ),
      this,
    );

    connectionInfoEventHandler.onEvent<IConnectionInfoEvent>(
      ServerEventId.CbDatasourceDeleted,
      data => {
        const key = resourceKeyList(
          data.dataSourceIds.map<IConnectionInfoParams>(connectionId => ({
            projectId: data.projectId,
            connectionId,
          })),
        );

        if (this.isConnected(key)) {
          const connection = this.get(key);
          this.dataSynchronizationService
            .requestSynchronization('connection', connection.map(connection => connection?.name).join('\n'))
            .then(state => {
              if (state) {
                this.delete(key);
              }
            });
        } else {
          this.delete(key);
        }
      },
      undefined,
      this,
    );

    makeObservable<this, 'nodeIdMap'>(this, {
      nodeIdMap: observable,
      createFromTemplate: action,
      create: action,
      createFromNode: action,
      add: action,
    });
  }

  /** After a session global update, connections and tree resources start loading concurrently,
   *  and there is a chance that the connection is already closed, but we are unaware of it.
   *  Use it when you want to be sure that connected status of the connection is valid,
   *  for example when you use it as an active flag inside the tree resource
   * */
  isSessionUpdate(): boolean {
    return this.sessionUpdate;
  }

  getEmptyConfig(): ConnectionConfig {
    return {
      template: false,
      saveCredentials: false,
    };
  }

  isConnected(key: IConnectionInfoParams): boolean;
  isConnected(key: ResourceKeyList<IConnectionInfoParams>): boolean;
  isConnected(key: ResourceKey<IConnectionInfoParams>): boolean;
  isConnected(key: ResourceKey<IConnectionInfoParams>): boolean {
    key = ResourceKeyUtils.toList(this.transformToKey(key));
    return this.get(key).every(connection => connection?.connected ?? false);
  }

  // TODO: we need here node path ie ['', 'project://', 'database://...', '...']
  getConnectionForNode(nodeId: string): Connection | undefined {
    if (!nodeId.startsWith('database://')) {
      return;
    }

    const indexOfConnectionPart = nodeId.indexOf('/', 11);
    const connectionPart = nodeId.slice(0, indexOfConnectionPart > -1 ? indexOfConnectionPart : nodeId.length);

    const connectionId = this.nodeIdMap.get(connectionPart);

    if (connectionId) {
      return this.get(connectionId);
    }

    return undefined;
  }

  async create(projectId: string, config: ConnectionConfig): Promise<Connection> {
    let key: IConnectionInfoParams | undefined;

    if (config.connectionId) {
      key = createConnectionParam(projectId, config.connectionId);
    }

    const { connection } = await this.graphQLService.sdk.createConnection({
      projectId: projectId,
      config,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(key),
    });

    return this.add(connection, true);
  }

  async searchDatabases(hosts: string[]): Promise<AdminConnectionSearchInfo[]> {
    const { databases } = await this.graphQLService.sdk.searchDatabases({ hosts });

    return databases;
  }

  async test(projectId: string, config: ConnectionConfig): Promise<TestConnectionMutation['connection']> {
    const { connection } = await this.graphQLService.sdk.testConnection({
      projectId,
      config,
    });

    return connection;
  }

  async createFromNode(projectId: string, nodeId: string, nodeName: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromNode({
      projectId,
      nodePath: nodeId,
      config: { name: nodeName },
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(),
    });

    return this.add(connection);
  }

  async createFromTemplate(projectId: string, templateId: string, connectionName: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromTemplate({
      projectId,
      templateId,
      connectionName,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(),
    });
    return this.add(connection);
  }

  // addList(connections: Connection[]): Connection[] {
  //   const newConnections = connections.filter(connection => !this.has({
  //     projectId: connection.projectId,
  //     connectionId: connection.id,
  //   }));

  //   const key = this.updateConnection(...connections);

  //   for (const connection of newConnections) {
  //     this.onConnectionCreate.execute(this.get({
  //       projectId: connection.projectId,
  //       connectionId: connection.id,
  //     })!);
  //   }

  //   return this.get(key) as Connection[];
  // }

  add(connection: Connection, isNew = false): Connection {
    const key = createConnectionParam(connection);
    const exists = this.has(key);

    const newConnection: NewConnection = {
      ...connection,
      [NEW_CONNECTION_SYMBOL]: isNew,
      timestamp: Date.now(),
    };

    this.set(createConnectionParam(newConnection), newConnection);
    const observedConnection = this.get(key)!;

    if (!exists) {
      this.onConnectionCreate.execute(observedConnection);
    }

    return observedConnection;
  }

  async loadAccessSubjects(connectionKey: IConnectionInfoParams): Promise<AdminConnectionGrantInfo[]> {
    const subjects = await this.performUpdate(connectionKey, [], async () => {
      const { subjects } = await this.graphQLService.sdk.getConnectionAccess({
        projectId: connectionKey.projectId,
        connectionId: connectionKey.connectionId,
      });
      return subjects;
    });

    return subjects;
  }

  async setAccessSubjects(connectionKey: IConnectionInfoParams, subjects: string[]): Promise<void> {
    await this.graphQLService.sdk.setConnectionAccess({
      projectId: connectionKey.projectId,
      connectionId: connectionKey.connectionId,
      subjects,
    });
  }

  async init(config: ConnectionInitConfig): Promise<Connection> {
    const key: IConnectionInfoParams = { projectId: config.projectId, connectionId: config.connectionId };

    await this.performUpdate(key, [], async () => {
      const { connection } = await this.graphQLService.sdk.initConnection({
        ...config,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key),
      });
      this.set(createConnectionParam(connection), connection);
    });

    return this.get(key)!;
  }

  async changeConnectionView(key: IConnectionInfoParams, settings: NavigatorViewSettings): Promise<Connection> {
    await this.performUpdate(key, [], async () => {
      const connectionNavigatorViewSettings = this.get(key)?.navigatorSettings || DEFAULT_NAVIGATOR_VIEW_SETTINGS;
      const { connection } = await this.graphQLService.sdk.setConnectionNavigatorSettings({
        connectionId: key.connectionId,
        projectId: key.projectId,
        settings: { ...connectionNavigatorViewSettings, ...settings },
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key),
      });

      this.set(createConnectionParam(connection), connection);
    });

    return this.get(key)!;
  }

  async update(key: IConnectionInfoParams, config: ConnectionConfig): Promise<DatabaseConnection> {
    await this.performUpdate(key, [], async () => {
      const { connection } = await this.graphQLService.sdk.updateConnection({
        projectId: key.projectId,
        config,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key),
      });

      this.set(createConnectionParam(connection), connection);
    });
    return this.get(key)!;
  }

  async close(key: IConnectionInfoParams): Promise<Connection> {
    await this.performUpdate(key, [], async () => {
      const { connection } = await this.graphQLService.sdk.closeConnection({
        projectId: key.projectId,
        connectionId: key.connectionId,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key),
      });

      this.set(createConnectionParam(connection), connection);
    });

    const connection = this.get(key)!;
    this.onConnectionClose.execute(connection);
    return connection;
  }

  deleteConnection(key: IConnectionInfoParams): Promise<void>;
  deleteConnection(key: ResourceKeyList<IConnectionInfoParams>): Promise<void>;
  deleteConnection(key: ResourceKey<IConnectionInfoParams>): Promise<void>;
  async deleteConnection(key: ResourceKey<IConnectionInfoParams>): Promise<void> {
    key = this.transformToKey(key);
    await ResourceKeyUtils.forEachAsync(key, async key => {
      await this.performUpdate(key, [], async () => {
        await this.graphQLService.sdk.deleteConnection({ projectId: key.projectId, connectionId: key.connectionId });
      });
      this.delete(key);
    });
  }

  // async updateSessionConnections(): Promise<boolean> {
  //   if (!this.changed) {
  //     return false;
  //   }

  //   await this.graphQLService.sdk.refreshSessionConnections();
  //   this.changed = false;
  //   return true;
  // }

  cleanNewFlags(): void {
    for (const connection of this.data.values()) {
      (connection as NewConnection)[NEW_CONNECTION_SYMBOL] = false;
    }
  }

  isKeyEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(param, second);
  }

  protected async loader(
    originalKey: ResourceKey<IConnectionInfoParams>,
    includes: CachedResourceIncludeArgs<Connection, ConnectionInfoIncludes>,
    refresh: boolean,
  ): Promise<Map<IConnectionInfoParams, Connection>> {
    const connectionsList: Connection[] = [];
    const projectKey = this.isAlias(originalKey, ConnectionInfoProjectKey);
    let removedConnections: IConnectionInfoParams[] = [];
    let projectId: string | undefined;
    let projectIds: string[] | undefined;

    if (projectKey) {
      projectIds = projectKey.options.projectIds;
    }

    if (this.isAlias(originalKey, ConnectionInfoActiveProjectKey)) {
      projectIds = this.projectsService.activeProjects.map(project => project.id);
    }

    if (isResourceAlias(originalKey)) {
      const key = this.transformToKey(originalKey);
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

      const { connections } = await this.graphQLService.sdk.getUserConnections({
        projectId,
        connectionId,
        projectIds,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key, includes),
      });

      if (connectionId && !connections.some(connection => connection.id === connectionId)) {
        throw new Error(`Connection is not found (${connectionId})`);
      }

      connectionsList.push(...connections);
    });

    runInAction(() => {
      if (isResourceAlias(originalKey)) {
        removedConnections = ResourceKeyUtils.toList(this.transformToKey(originalKey)).filter(
          key => !connectionsList.some(connection => isConnectionInfoParamEqual(key, createConnectionParam(connection))),
        );
      }

      this.delete(resourceKeyList(removedConnections));
      const key = resourceKeyList(connectionsList.map(createConnectionParam));
      this.set(key, connectionsList);
    });
    this.sessionUpdate = false;

    return this.data;
  }

  protected dataSet(key: IConnectionInfoParams, value: Connection): void {
    const oldConnections = this.dataGet(key);
    if (value.nodePath) {
      this.nodeIdMap.set(value.nodePath, key);
    }
    super.dataSet(key, { ...oldConnections, ...value });
  }

  protected dataDelete(key: IConnectionInfoParams): void {
    const connection = this.dataGet(key);
    if (connection?.nodePath) {
      this.nodeIdMap.delete(connection.nodePath);
    }
    super.dataDelete(key);
  }

  protected resetDataToDefault(): void {
    super.resetDataToDefault();
    this.nodeIdMap.clear();
  }

  private getDefaultIncludes(): ConnectionInfoIncludes {
    return {
      includeNetworkHandlersConfig: false,
      customIncludeOriginDetails: false,
      includeAuthProperties: false,
      includeOrigin: false,
      includeAuthNeeded: false,
      includeCredentialsSaved: false,
      includeProperties: false,
      includeProviderProperties: false,
      customIncludeOptions: false,
    };
  }

  protected validateKey(key: IConnectionInfoParams): boolean {
    return typeof key === 'object' && typeof key.projectId === 'string' && typeof key.connectionId === 'string';
  }
}

export function isConnectionInfoParamEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
  return param.projectId === second.projectId && param.connectionId === second.connectionId;
}

export function serializeConnectionParam(key: IConnectionInfoParams): string {
  return `${key.projectId}:${key.connectionId}`;
}

export function isNewConnection(connection: Connection | NewConnection): connection is NewConnection {
  return (connection as NewConnection)[NEW_CONNECTION_SYMBOL];
}

export function compareConnectionsInfo(a: DatabaseConnection, b: DatabaseConnection): number {
  return a.name.localeCompare(b.name);
}

export function compareNewConnectionsInfo(a: DatabaseConnection, b: DatabaseConnection): number {
  if (isNewConnection(a) && isNewConnection(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewConnection(b)) {
    return 1;
  }

  if (isNewConnection(a)) {
    return -1;
  }

  return 0;
}

export function createConnectionParam(connection: Connection): IConnectionInfoParams;
export function createConnectionParam(projectId: string, connectionId: string): IConnectionInfoParams;
export function createConnectionParam(projectIdOrConnection: string | Connection, connectionId?: string): IConnectionInfoParams {
  if (typeof projectIdOrConnection === 'object') {
    connectionId = projectIdOrConnection.id;
    projectIdOrConnection = projectIdOrConnection.projectId;
  }

  return {
    projectId: projectIdOrConnection,
    connectionId: connectionId!,
  };
}
