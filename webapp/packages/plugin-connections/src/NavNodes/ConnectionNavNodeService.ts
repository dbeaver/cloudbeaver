/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter, type IAsyncContextLoader, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import {
  type INodeNavigationData,
  NavNodeInfoResource,
  NavNodeManagerService,
  NavTreeResource,
  NodeManagerUtils,
} from '@cloudbeaver/core-navigation-tree';
import { getProjectNodeId } from '@cloudbeaver/core-projects';
import { isResourceAlias, type ResourceKey, resourceKeyList, type ResourceKeySimple, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { ServerEventId } from '@cloudbeaver/core-root';
import {
  ConnectionInfoResource,
  ContainerResource,
  ConnectionsManagerService,
  getFolderNodeParents,
  type Connection,
  ConnectionInfoActiveProjectKey,
  type IConnectionInfoParams,
  getConnectionParentId,
  createConnectionParam,
  ConnectionFolderEventHandler,
  type IConnectionFolderEvent,
} from '@cloudbeaver/core-connections';

@injectable()
export class ConnectionNavNodeService extends Dependency {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navTreeResource: NavTreeResource,
    private readonly containerResource: ContainerResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    // TODO: https://dbeaver.atlassian.net/browse/CB-6272
    // private readonly navigationTreeService: NavigationTreeService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly connectionFolderEventHandler: ConnectionFolderEventHandler,
  ) {
    super();

    makeObservable<this, 'connectionUpdateHandler' | 'connectionRemoveHandler' | 'connectionCreateHandler'>(this, {
      connectionUpdateHandler: action.bound,
      connectionRemoveHandler: action.bound,
      connectionCreateHandler: action.bound,
    });

    this.connectionInfoResource.onDataOutdated.addHandler(this.connectionUpdateHandler); // duplicates onItemAdd in some cases
    this.connectionInfoResource.onItemUpdate.addHandler(this.connectionUpdateHandler);
    this.connectionInfoResource.onItemDelete.addHandler(this.connectionRemoveHandler);
    this.connectionInfoResource.onConnectionCreate.addHandler(this.connectionCreateHandler);
    this.navNodeInfoResource.onDataOutdated.addHandler(this.navNodeOutdateHandler.bind(this));

    this.navTreeResource.before(this.preloadConnectionInfo.bind(this));

    this.navNodeManagerService.navigator.addHandler(this.navigateHandler.bind(this));

    this.connectionInfoResource.connect(this.navTreeResource);

    this.connectionFolderEventHandler.onEvent<IConnectionFolderEvent>(
      ServerEventId.CbDatasourceFolderCreated,
      data => {
        const parents = data.nodePaths.map(nodeId => {
          const parents = getFolderNodeParents(nodeId);

          return parents[parents.length - 1]!;
        });
        this.navTreeResource.markOutdated(resourceKeyList(parents));
      },
      undefined,
      this.navTreeResource,
    );
    this.connectionFolderEventHandler.onEvent<IConnectionFolderEvent>(
      ServerEventId.CbDatasourceFolderDeleted,
      data => {
        const parents = data.nodePaths.map(nodeId => {
          const parents = getFolderNodeParents(nodeId);

          return parents[parents.length - 1]!;
        });

        this.navTreeResource.deleteInNode(
          resourceKeyList(parents),
          data.nodePaths.map(value => [value]),
        );
      },
      undefined,
      this.navTreeResource,
    );
    this.connectionFolderEventHandler.onEvent<IConnectionFolderEvent>(
      ServerEventId.CbDatasourceFolderUpdated,
      data => {
        this.navTreeResource.markOutdated(resourceKeyList(data.nodePaths));
      },
      undefined,
      this.navTreeResource,
    );
  }

  navigationNavNodeConnectionContext: IAsyncContextLoader<Connection | undefined, INodeNavigationData> = async (context, { nodeId }) => {
    await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);
    const connection = this.connectionInfoResource.getConnectionForNode(nodeId);

    return connection;
  };

  private async preloadConnectionInfo(key: ResourceKey<string>, context: IExecutionContextProvider<ResourceKey<string>>) {
    if (isResourceAlias(key)) {
      return;
    }
    if (!ResourceKeyUtils.some(key, key => NodeManagerUtils.isDatabaseObject(key))) {
      return;
    }

    await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);

    const notConnected = ResourceKeyUtils.some(key, key => {
      const connection = this.connectionInfoResource.getConnectionForNode(key);

      return !!connection && !connection.connected;
    });

    if (notConnected) {
      ExecutorInterrupter.interrupt(context);
      throw new Error('Connection not established');
    }
  }

  private connectionUpdateHandler(key: ResourceKey<IConnectionInfoParams>) {
    let connectionInfos = this.connectionInfoResource.get(key);
    const outdatedTrees: string[] = [];
    const closedConnections: string[] = [];

    connectionInfos = Array.isArray(connectionInfos) ? connectionInfos : [connectionInfos];
    for (const connectionInfo of connectionInfos) {
      if (!connectionInfo?.nodePath || connectionInfo.template) {
        return;
      }

      const node = this.navNodeInfoResource.get(connectionInfo.nodePath);
      const parentId = getConnectionParentId(connectionInfo.projectId, connectionInfo.folder); // new parent

      if (!connectionInfo.connected) {
        closedConnections.push(connectionInfo.nodePath);
        outdatedTrees.push(connectionInfo.nodePath);
      }

      const folderId = node?.parentId; // current parent

      if (folderId && !outdatedTrees.includes(folderId)) {
        outdatedTrees.push(folderId);
      }

      if (!outdatedTrees.includes(parentId)) {
        outdatedTrees.push(parentId);
      }
    }

    if (closedConnections.length > 0) {
      const key = resourceKeyList(closedConnections);

      if (this.navTreeResource.has(key)) {
        this.navTreeResource.delete(key);
      }
    }

    if (outdatedTrees.length > 0) {
      const key = resourceKeyList(outdatedTrees);
      this.navTreeResource.markOutdated(key);
    }
  }

  private connectionRemoveHandler(key: ResourceKeySimple<IConnectionInfoParams>) {
    ResourceKeyUtils.forEach(key, key => {
      const connectionInfo = this.connectionInfoResource.get(key);

      if (!connectionInfo || connectionInfo.template) {
        return;
      }

      const nodePath = connectionInfo.nodePath ?? NodeManagerUtils.connectionIdToConnectionNodeId(key.connectionId);

      const node = this.navNodeInfoResource.get(nodePath);
      const folder = node?.parentId ?? getProjectNodeId(key.projectId);

      if (nodePath) {
        this.navTreeResource.deleteInNode(folder, [nodePath]);
      }
    });
  }

  private async connectionCreateHandler(connection: Connection) {
    if (!connection.nodePath || connection.template) {
      return;
    }

    try {
      const parentId = getConnectionParentId(connection.projectId, connection.folder);

      await this.navTreeResource.waitLoad();

      if (!this.navTreeResource.has(parentId)) {
        await this.navNodeInfoResource.loadNodeParents(parentId);
        const parents = this.navNodeInfoResource.getParents(parentId);

        this.navTreeResource.markOutdated(parents[parents.length - 1]);
        const preloaded = await this.navTreeResource.preloadNodeParents(parents, parentId);

        if (!preloaded) {
          return;
        }
      }

      let children = this.navTreeResource.get(parentId);

      if (!children || children.includes(connection.nodePath)) {
        return;
      }

      const connectionNode = await this.navNodeInfoResource.load(connection.nodePath);
      await this.navTreeResource.waitLoad();

      this.navNodeInfoResource.setParent(connection.nodePath, parentId);

      children = this.navTreeResource.get(parentId);

      if (!children || children.includes(connection.nodePath)) {
        return; // double check
      }

      let insertIndex = 0;

      const nodes = this.navNodeInfoResource.get(resourceKeyList(children));

      for (const node of nodes) {
        if (!node?.folder && node?.name?.localeCompare(connectionNode.name!) === 1) {
          break;
        }
        insertIndex++;
      }

      this.navTreeResource.insertToNode(parentId, insertIndex, connection.nodePath);
    } finally {
      // TODO: https://dbeaver.atlassian.net/browse/CB-6272
      // await this.navNodeInfoResource.loadNodeParents(connection.nodePath);
      // await this.navigationTreeService.showNode(connection.nodePath, this.navNodeInfoResource.getParents(connection.nodePath));
    }
  }

  private async navigateHandler({ nodeId }: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>): Promise<void> {
    let connection: Connection | undefined | null = await contexts.getContext(this.navigationNavNodeConnectionContext);

    if (NodeManagerUtils.isDatabaseObject(nodeId) && connection) {
      connection = await this.connectionsManagerService.requireConnection(createConnectionParam(connection));

      if (!connection?.connected) {
        ExecutorInterrupter.interrupt(contexts);
      }
    }
  }

  private navNodeOutdateHandler(key: ResourceKey<string>) {
    const outdateKeys = this.containerResource.entries
      .filter(([_, value]) =>
        ResourceKeyUtils.some(
          key,
          key =>
            value.parentNode?.id === key ||
            value.catalogList.some(catalog => catalog.catalog?.id === key || catalog.schemaList.some(schema => schema?.id === key)) ||
            value.schemaList.some(schema => schema?.id === key),
        ),
      )
      .map(([key]) => key);

    this.containerResource.markOutdated(resourceKeyList(outdateKeys));
  }
}
