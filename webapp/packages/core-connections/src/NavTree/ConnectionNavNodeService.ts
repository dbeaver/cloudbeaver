/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter, IAsyncContextLoader, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { INodeNavigationData, NavigationType, NavNodeInfoResource, NavNodeManagerService, NavTreeResource, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { getProjectNodeId } from '@cloudbeaver/core-projects';
import { type ResourceKey, ResourceKeyUtils, resourceKeyList, CachedMapAllKey, CbEventStatus } from '@cloudbeaver/core-sdk';

import { ConnectionFolderEventHandler, IConnectionFolderEvent } from '../ConnectionFolderEventHandler';
import { Connection, ConnectionInfoResource, createConnectionParam } from '../ConnectionInfoResource';
import { ConnectionsManagerService } from '../ConnectionsManagerService';
import type { IConnectionInfoParams } from '../IConnectionsResource';
import { getConnectionParentId } from './getConnectionParentId';
import { getFolderNodeParents } from './getFolderParents';

@injectable()
export class ConnectionNavNodeService extends Dependency {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navTreeResource: NavTreeResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
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
    this.connectionInfoResource.onItemAdd.addHandler(this.connectionUpdateHandler);
    this.connectionInfoResource.onItemDelete.addHandler(this.connectionRemoveHandler);
    this.connectionInfoResource.onConnectionCreate.addHandler(this.connectionCreateHandler);

    this.navTreeResource.before(this.preloadConnectionInfo.bind(this));

    this.navNodeManagerService.navigator.addHandler(this.navigateHandler.bind(this));

    this.connectionFolderEventHandler.on<IConnectionFolderEvent>(
      data => {
        const parents = data.nodePaths.map(nodeId => {
          const parents = getFolderNodeParents(nodeId);

          return parents[parents.length - 2];
        });
        this.navTreeResource.markTreeOutdated(resourceKeyList(parents));
      },
      v => v,
      event => event.eventType === CbEventStatus.TypeCreate
    ).on<IConnectionFolderEvent>(
      data => {
        const parents = data.nodePaths.map(nodeId => {
          const parents = getFolderNodeParents(nodeId);

          return parents[parents.length - 2];
        });

        this.navTreeResource.deleteInNode(resourceKeyList(parents), data.nodePaths);
      },
      v => v,
      event => event.eventType === CbEventStatus.TypeDelete
    ).on<IConnectionFolderEvent>(
      data => {
        this.navTreeResource.markOutdated(resourceKeyList(data.nodePaths));
      },
      v => v,
      event => event.eventType === CbEventStatus.TypeUpdate
    );
  }

  navigationNavNodeConnectionContext: IAsyncContextLoader<Connection | undefined, INodeNavigationData> = async (
    context,
    {
      nodeId,
    }
  ) => {
    await this.connectionInfoResource.load(CachedMapAllKey);
    const connection = this.connectionInfoResource.getConnectionForNode(nodeId);

    return connection;
  };

  private async preloadConnectionInfo(
    key: ResourceKey<string>,
    context: IExecutionContextProvider<ResourceKey<string>>
  ) {
    await this.connectionInfoResource.load(CachedMapAllKey);
    key = this.navTreeResource.transformParam(key);

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
    key = this.connectionInfoResource.transformParam(key);
    const outdatedTrees: string[] = [];
    const closedConnections: string[] = [];

    ResourceKeyUtils.forEach(key, key => {
      const connectionInfo = this.connectionInfoResource.get(key);

      if (!connectionInfo?.nodePath || connectionInfo.template) {
        return;
      }

      const node = this.navNodeInfoResource.get(connectionInfo.nodePath);

      const parentId = getConnectionParentId(connectionInfo.projectId, connectionInfo.folder);

      if (!connectionInfo.connected) {
        closedConnections.push(connectionInfo.nodePath);
        outdatedTrees.push(connectionInfo.nodePath);
      }

      const folderId = node?.parentId;

      if (folderId && !outdatedTrees.includes(folderId)) {
        outdatedTrees.push(folderId);
      }

      if (!outdatedTrees.includes(parentId)) {
        outdatedTrees.push(parentId);
      }
    });

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

  private connectionRemoveHandler(key: ResourceKey<IConnectionInfoParams>) {
    key = this.connectionInfoResource.transformParam(key);
    ResourceKeyUtils.forEach(key, key => {
      const connectionInfo = this.connectionInfoResource.get(key);

      if (!connectionInfo || connectionInfo.template) {
        return;
      }

      let nodePath = connectionInfo.nodePath;

      if (!nodePath) {
        nodePath = NodeManagerUtils.connectionIdToConnectionNodeId(key.connectionId);
      }

      const node = this.navNodeInfoResource.get(nodePath);
      const folder = (
        node?.parentId
        ?? getProjectNodeId(key.projectId)
      );

      if (nodePath) {
        this.navTreeResource.deleteInNode(folder, [nodePath]);
      }
    });
  }

  private async connectionCreateHandler(connection: Connection) {
    if (!connection.nodePath || connection.template) {
      return;
    }

    const node = this.navNodeInfoResource.get(connection.nodePath);
    const folder = (
      node?.parentId
      ?? getProjectNodeId(connection.projectId)
    );

    const children = this.navTreeResource.get(folder);

    if (!children) {
      return;
    }

    const connectionNode = await this.navNodeInfoResource.load(connection.nodePath);
    this.navNodeInfoResource.setParent(connection.nodePath, folder);

    let insertIndex = 0;

    const nodes = this.navNodeInfoResource.get(resourceKeyList(children));

    for (const node of nodes) {
      if (!node?.folder && node?.name?.localeCompare(connectionNode.name!) === 1) {
        break;
      }
      insertIndex++;
    }

    this.navTreeResource.insertToNode(folder, insertIndex, connection.nodePath);
  }

  private async navigateHandler(
    {
      type,
      nodeId,
    }: INodeNavigationData,
    contexts: IExecutionContextProvider<INodeNavigationData>
  ): Promise<void> {
    if (type !== NavigationType.open) {
      return;
    }

    let connection: Connection | undefined | null = await contexts.getContext(this.navigationNavNodeConnectionContext);

    if (NodeManagerUtils.isDatabaseObject(nodeId) && connection) {
      connection = await this.connectionsManagerService.requireConnection(
        createConnectionParam(connection)
      );

      if (!connection?.connected) {
        throw new Error('Connection not established');
      }
    }
  }
}