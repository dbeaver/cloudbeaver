/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable, runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { SyncExecutor, ExecutorInterrupter, ISyncExecutor } from '@cloudbeaver/core-executor';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { NavigatorViewSettings, SessionDataResource, DataSynchronizationService, ServerEventId } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ConnectionConfig,
  UserConnectionAuthPropertiesFragment,
  resourceKeyList,
  InitConnectionMutationVariables,
  GetUserConnectionsQueryVariables,
  ResourceKey,
  ResourceKeyUtils,
  TestConnectionMutation,
  NavigatorSettingsInput,
  ResourceKeyList,
  CachedMapAllKey,
  CachedResourceIncludeArgs,
  AdminConnectionSearchInfo,
  AdminConnectionGrantInfo,
  isResourceKeyList,
} from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { ConnectionInfoEventHandler, IConnectionInfoEvent } from './ConnectionInfoEventHandler';
import type { DatabaseConnection } from './DatabaseConnection';
import type { IConnectionInfoParams } from './IConnectionsResource';

export type Connection = DatabaseConnection & {
  authProperties?: UserConnectionAuthPropertiesFragment[];
};
export type ConnectionInitConfig = Omit<InitConnectionMutationVariables, 'includeOrigin' | 'customIncludeOriginDetails' | 'includeAuthProperties' | 'includeNetworkHandlersConfig' | 'includeAuthNeeded' | 'includeCredentialsSaved' | 'includeProperties' | 'includeProviderProperties' | 'customIncludeOptions'>;
export type ConnectionInfoIncludes = Omit<GetUserConnectionsQueryVariables, 'id'>;

export const NEW_CONNECTION_SYMBOL = Symbol('new-connection');

export type NewConnection = Connection & { [NEW_CONNECTION_SYMBOL]: boolean; timestamp: number };

const connectionInfoProjectKeySymbol = Symbol('@connection-info/projects') as unknown as IConnectionInfoParams;
export const ConnectionInfoProjectKey = (...projectIds: string[]) => resourceKeyList<IConnectionInfoParams>(
  [connectionInfoProjectKeySymbol],
  projectIds
);

const connectionInfoActiveProjectKeySymbol = Symbol('@connection-info/projects-active') as unknown as IConnectionInfoParams;
export const ConnectionInfoActiveProjectKey = resourceKeyList<IConnectionInfoParams>(
  [connectionInfoActiveProjectKeySymbol],
  'active-projects'
);

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
export class ConnectionInfoResource
  extends CachedMapResource<IConnectionInfoParams, Connection, ConnectionInfoIncludes> {
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
  ) {
    super();

    this.onConnectionCreate = new SyncExecutor();
    this.onConnectionClose = new SyncExecutor();
    this.sessionUpdate = false;
    this.nodeIdMap = new Map();

    this.addAlias(
      isConnectionInfoProjectKey,
      param => resourceKeyList(this.keys.filter(key => param.mark.includes(key.projectId))),
      (a, b) => isArraysEqual(a.mark, b.mark)
    );

    this.addAlias(
      isConnectionInfoActiveProjectKey,
      () => resourceKeyList(
        this.keys.filter(key => projectsService.activeProjects.some(({ id }) => id === key.projectId))
      ),
      (a, b) => a.mark === b.mark
    );

    // in case when session was refreshed all data depended on connection info
    // should be refreshed by session update executor
    // it's prevents double nav tree refresh
    // this.onItemAdd.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));
    this.onItemDelete.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));
    this.onConnectionCreate.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));

    appAuthService.requireAuthentication(this);
    this.sync(this.projectInfoResource, () => CachedMapAllKey, () => CachedMapAllKey);
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
      data => resourceKeyList(data.dataSourceIds.map<IConnectionInfoParams>(connectionId => ({
        projectId: data.projectId,
        connectionId,
      }))),
      this
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
      data => resourceKeyList(data.dataSourceIds.map<IConnectionInfoParams>(connectionId => ({
        projectId: data.projectId,
        connectionId,
      }))),
      this
    );

    connectionInfoEventHandler.onEvent<IConnectionInfoEvent>(
      ServerEventId.CbDatasourceDeleted,
      data => {
        const key = resourceKeyList(data.dataSourceIds.map<IConnectionInfoParams>(connectionId => ({
          projectId: data.projectId,
          connectionId,
        })));

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
      this
    );

    makeObservable<this, 'nodeIdMap' | 'updateConnection'>(this, {
      nodeIdMap: observable,
      updateConnection: action,
      createFromTemplate: action,
      create: action,
      createFromNode: action,
      add: action,
    });
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
    return ResourceKeyUtils.every(key, key => this.get(key)?.connected ?? false);
  }

  // TODO: we need here node path ie ['', 'project://', 'database://...', '...']
  getConnectionForNode(nodeId: string): Connection | undefined {
    if (!nodeId.startsWith('database://')) {
      return;
    }

    const indexOfConnectionPart = nodeId.indexOf('/', 11);
    const connectionPart = nodeId.slice(
      0,
      indexOfConnectionPart > -1 ? indexOfConnectionPart : nodeId.length
    );

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
    this.updateConnection(newConnection);

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
      this.updateConnection(connection);
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

      this.updateConnection(connection);
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

      this.updateConnection(connection);
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

      this.updateConnection(connection);
    });

    const connection = this.get(key)!;
    this.onConnectionClose.execute(connection);
    return connection;
  }

  deleteConnection(key: IConnectionInfoParams): Promise<void>;
  deleteConnection(key: ResourceKeyList<IConnectionInfoParams>): Promise<void>;
  deleteConnection(key: ResourceKey<IConnectionInfoParams>): Promise<void>;
  async deleteConnection(key: ResourceKey<IConnectionInfoParams>): Promise<void> {
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
    refresh: boolean
  ): Promise<Map<IConnectionInfoParams, Connection>> {
    let projectId: string | undefined;
    let projectIds: string[] | undefined;
    let all = this.isAliasEqual(originalKey, CachedMapAllKey);
    let isProjectKey = isConnectionInfoProjectKey(originalKey);
    const isActiveProjectKey = isConnectionInfoActiveProjectKey(originalKey);
    let key = this.transformParam(originalKey);

    if (isProjectKey) {
      projectIds = (originalKey as ResourceKeyList<IConnectionInfoParams>).mark;
    }

    if (isActiveProjectKey) {
      projectIds = this.projectsService.activeProjects.map(project => project.id);
    }

    if (all || isProjectKey || isActiveProjectKey) {
      const outdated = ResourceKeyUtils.filter(key, key => this.isOutdated(key));
      if (refresh || outdated.length !== 1) {
        key = originalKey;
      } else {
        key = outdated[0]; // load only single connection
        all = false;
        isProjectKey = false;
      }
    }

    await ResourceKeyUtils.forEachAsync(
      key,
      async (
        key: IConnectionInfoParams
      ) => {
        let connectionId: string | undefined;

        if (!all && !isProjectKey && !isActiveProjectKey) {
          connectionId = key.connectionId;
          projectId = key.projectId;
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

        runInAction(() => {
          if (all) {
            this.resetIncludes();
            const unrestoredConnectionIdList = Array.from(this.keys)
              .filter(key => !connections.some(connection => (
                connection.projectId === key.projectId
                && connection.id === key.connectionId
              )));

            this.delete(resourceKeyList(unrestoredConnectionIdList));
          }

          if (isProjectKey || isActiveProjectKey) {
            const removedConnections = this.keys
              .filter(key => (
                projectIds?.includes(key.projectId)
                && !connections.some(f => (
                  key.projectId === f.projectId
                  && key.connectionId === f.id
                ))
              ));

            this.delete(resourceKeyList(removedConnections));
          }

          this.updateConnection(...connections);
        });
      });
    this.sessionUpdate = false;

    return this.data;
  }

  protected dataSet(key: IConnectionInfoParams, value: Connection): void {
    key = this.getKeyRef(key);

    this.data.set(key, value);

    if (value.nodePath) {
      this.nodeIdMap.set(value.nodePath, key);
    }
  }

  protected dataDelete(key: IConnectionInfoParams): void {
    key = this.getKeyRef(key);

    this.data.delete(key);

    const entity = Array.from(this.nodeIdMap.entries()).find(([nodeId, connectionKey]) => connectionKey === key);
    if (entity) {
      this.nodeIdMap.delete(entity[0]);
    }
  }

  private updateConnection(...connections: Connection[]): ResourceKeyList<IConnectionInfoParams> {
    const key = resourceKeyList(connections.map(createConnectionParam));

    const oldConnections = this.get(key);
    this.set(key, oldConnections.map((connection, i) => ({ ...connection, ...connections[i] })));

    return key;
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

  protected validateParam(param: ResourceKey<IConnectionInfoParams>): boolean {
    return (
      super.validateParam(param)
      || param === connectionInfoProjectKeySymbol
      || param === connectionInfoActiveProjectKeySymbol
      || (
        typeof param === 'object' && !isResourceKeyList(param)
        && typeof param.projectId === 'string'
        && ['string'].includes(typeof param.connectionId)
      )
    );
  }
}

function isConnectionInfoProjectKey(
  param: ResourceKey<IConnectionInfoParams>
): param is ResourceKeyList<IConnectionInfoParams> {
  return isResourceKeyList(param) && param.list.includes(connectionInfoProjectKeySymbol);
}

function isConnectionInfoActiveProjectKey(
  param: ResourceKey<IConnectionInfoParams>
): param is ResourceKeyList<IConnectionInfoParams> {
  return isResourceKeyList(param) && param.list.includes(connectionInfoActiveProjectKeySymbol);
}

export function isConnectionInfoParamEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
  return (
    param.projectId === second.projectId
    && param.connectionId === second.connectionId
  );
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

  return compareConnectionsInfo(a, b);
}

export function createConnectionParam(
  connection: Connection
): IConnectionInfoParams;
export function createConnectionParam(
  projectId: string,
  connectionId: string
): IConnectionInfoParams;
export function createConnectionParam(
  projectIdOrConnection: string | Connection,
  connectionId?: string
): IConnectionInfoParams {
  if (typeof projectIdOrConnection === 'object') {
    connectionId = projectIdOrConnection.id;
    projectIdOrConnection = projectIdOrConnection.projectId;
  }

  return {
    projectId: projectIdOrConnection,
    connectionId: connectionId!,
  };
}
