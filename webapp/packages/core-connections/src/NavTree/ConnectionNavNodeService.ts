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
import { INodeNavigationData, NavigationType, NavNodeInfoResource, NavNodeManagerService, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { getNodeIdResourceProject } from '@cloudbeaver/core-projects';
import { ServerEventId } from '@cloudbeaver/core-root';
import { type ResourceKey, ResourceKeyUtils, resourceKeyList, isResourceAlias, ResourceKeySimple } from '@cloudbeaver/core-sdk';
import { getPathParent, isDefined } from '@cloudbeaver/core-utils';

import { ConnectionFolderEventHandler, IConnectionFolderEvent } from '../ConnectionFolderEventHandler';
import { Connection, ConnectionInfoActiveProjectKey, ConnectionInfoResource, createConnectionParam } from '../ConnectionInfoResource';
import { ConnectionsManagerService } from '../ConnectionsManagerService';
import type { IConnectionInfoParams } from '../IConnectionsResource';
import { getConnectionParentId } from './getConnectionParentId';
import { getNodeIdDatasource } from './getNodeIdDatasource';
import { testNodeIdDatasource } from './testNodeIdDatasource';

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
    this.connectionInfoResource.onItemUpdate.addHandler(this.connectionUpdateHandler);
    this.connectionInfoResource.onItemDelete.addHandler(this.connectionRemoveHandler);
    this.connectionInfoResource.onConnectionCreate.addHandler(this.connectionCreateHandler);

    this.navTreeResource.before(this.preloadConnectionInfo.bind(this));

    this.navNodeManagerService.navigator.addHandler(this.navigateHandler.bind(this));

    this.connectionInfoResource.connect(this.navTreeResource);

    this.connectionFolderEventHandler.onEvent<IConnectionFolderEvent>(
      ServerEventId.CbDatasourceFolderCreated,
      data => {
        const parents = data.nodePaths.map(nodeId => getPathParent(nodeId));
        this.navTreeResource.markTreeOutdated(resourceKeyList(parents));
      },
      undefined,
      this.navTreeResource
    );
    this.connectionFolderEventHandler.onEvent<IConnectionFolderEvent>(
      ServerEventId.CbDatasourceFolderDeleted,
      data => {
        const parents = data.nodePaths.map(nodeId => getPathParent(nodeId));

        this.navTreeResource.deleteInNode(resourceKeyList(parents), data.nodePaths);
      },
      undefined,
      this.navTreeResource
    );
    this.connectionFolderEventHandler.onEvent<IConnectionFolderEvent>(
      ServerEventId.CbDatasourceFolderUpdated,
      data => {
        this.navTreeResource.markOutdated(resourceKeyList(data.nodePaths));
      },
      undefined,
      this.navTreeResource
    );
  }

  navigationNavNodeConnectionContext: IAsyncContextLoader<Connection | undefined, INodeNavigationData> = async (
    context,
    {
      nodeId,
    }
  ) => {
    await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);
    const connection = this.connectionInfoResource.getConnectionForNode(nodeId);

    return connection;
  };

  private async preloadConnectionInfo(
    key: ResourceKey<string>,
    context: IExecutionContextProvider<ResourceKey<string>>
  ) {
    if (isResourceAlias(key)) {
      return;
    }
    if (!ResourceKeyUtils.some(key, key => testNodeIdDatasource(key) !== null)) {
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

    connectionInfos = (Array.isArray(connectionInfos) ? connectionInfos : [connectionInfos]);
    for (const connectionInfo of connectionInfos) {
      if (!connectionInfo || connectionInfo.template) {
        return;
      }

      const nodePath = getNodeIdDatasource(connectionInfo);
      const parentId = getPathParent(nodePath);

      if (!connectionInfo.connected) {
        closedConnections.push(nodePath);
        outdatedTrees.push(nodePath);
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

      const nodePath = getNodeIdDatasource(connectionInfo);

      if (nodePath) {
        this.navTreeResource.deleteInNode(getPathParent(nodePath), [nodePath]);
      }
    });
  }

  private async connectionCreateHandler(connection: Connection) {
    if (connection.template) {
      return;
    }

    const nodePath = getNodeIdDatasource(connection);
    const parentId = getPathParent(nodePath);

    await this.navTreeResource.waitLoad();
    if (!this.navTreeResource.has(parentId)) {
      return;
    }

    let children = this.navTreeResource.get(parentId);

    if (!children || children.includes(nodePath)) {
      return;
    }

    const connectionNode = await this.navNodeInfoResource.load(nodePath);
    await this.navTreeResource.waitLoad();

    this.navNodeInfoResource.setParent(nodePath, parentId);

    children = this.navTreeResource.get(parentId);

    if (!children || children.includes(nodePath)) {
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

    this.navTreeResource.insertToNode(parentId, insertIndex, nodePath);
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

    if (testNodeIdDatasource(nodeId) && connection) {
      connection = await this.connectionsManagerService.requireConnection(
        createConnectionParam(connection)
      );

      if (!connection?.connected) {
        throw new Error('Connection not established');
      }
    }
  }
}