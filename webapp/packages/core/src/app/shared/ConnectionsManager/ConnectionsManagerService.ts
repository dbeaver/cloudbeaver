/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { Subject } from 'rxjs';

import { injectable } from '@dbeaver/core/di';
import { ConnectionShortInfo, SessionService } from '@dbeaver/core/root';
import {
  ConnectionInfo,
  DataSourceInfo,
  DriverInfo,
  GraphQLService,
  NavGetStructContainersQuery,
  CachedResource,
} from '@dbeaver/core/sdk';

import { NavigationTabsService } from '../NavigationTabs/NavigationTabsService';
import { NodesManagerService } from '../NodesManager/NodesManagerService';

export type DBDriver = Pick<
  DriverInfo,
  | 'id'
  | 'name'
  | 'icon'
  | 'description'
  | 'defaultPort'
  | 'sampleURL'
  | 'embedded'
  | 'anonymousAccess'
  | 'promotedScore'
>
export type DBSource = Pick<DataSourceInfo, 'id' | 'name' | 'driverId' | 'description'>
export type Connection = Pick<ConnectionInfo, 'id' | 'name' | 'connected' | 'driverId'>

export interface ISchema {
  id: string;
}

export interface ICatalogsAndSchemas {
  catalogs: ISchema[];
  schemas: ISchema[];
}

@injectable()
export class ConnectionsManagerService {

  @observable private connectionsMap: Map<string, Connection> = new Map();
  private dbDrivers = new CachedResource(new Map(), this.refreshDriversAsync.bind(this));

  @computed get connections(): Connection[] {
    return Array.from(this.connectionsMap.values());
  }

  onOpenConnection = new Subject<Connection>();
  onCloseConnection = new Subject<string>();

  constructor(private graphQLService: GraphQLService,
              private navigationTabsService: NavigationTabsService,
              private nodesManagerService: NodesManagerService,
              private sessionService: SessionService) {
  }

  getDBDrivers(): Map<string, DBDriver> {
    return this.dbDrivers.data;
  }

  async loadDriversAsync(): Promise<Map<string, DBDriver>> {
    return this.dbDrivers.load();
  }

  addOpenedConnection(connection: Connection) {
    this.connectionsMap.set(connection.id, connection);
    this.onOpenConnection.next(connection);
    this.nodesManagerService.updateRootChildren(); // Update connections list, probably here we must also request node info and add it to nodes manager
  }

  getConnectionById(connectionId: string): Connection | undefined {
    return this.connectionsMap.get(connectionId);
  }

  hasAnyConnection(): boolean {
    return Boolean(this.connections.length);
  }

  async closeAllConnections(): Promise<void> {
    for (const connection of this.connections) {
      await this.closeConnectionAsync(connection.id, true);
    }
    await this.nodesManagerService.updateRootChildren();
  }

  async closeConnectionAsync(id: string, skipNodesRefresh?: boolean): Promise<void> {
    await this.graphQLService.gql.closeConnection({ id });
    this.onCloseConnection.next(id);
    this.closeConnectionTabs(id);
    this.connectionsMap.delete(id);

    if (!skipNodesRefresh) {
      await this.nodesManagerService.updateRootChildren(); // Update connections list, probably here we must just remove nodes from nodes manager
    }
  }

  async getCatalogsAndSchemas(connectionId: string, catalogId?: string): Promise<ICatalogsAndSchemas> {
    const schemas = await this.loadSchemasAndCatalogs(connectionId, catalogId);
    const catalogAndSchemas: ICatalogsAndSchemas = {
      schemas: schemas.navGetStructContainers
        .schemaList.map(s => ({
          id: s.name || '',
        })),
      catalogs: schemas.navGetStructContainers
        .catalogList.map(s => ({
          id: s.name || '',
        })),
    };
    return catalogAndSchemas;
  }

  async loadConnectionDriver(driverId: string): Promise<DBDriver | null> {
    const drivers = await this.graphQLService.gql.getDriverById({ driverId });
    return drivers.driverList[0] || null;
  }

  async restoreConnections() {
    for (const connection of this.sessionService.getConnections()) {
      this.restoreConnection(connection);
    }
  }

  private async refreshDriversAsync(data: Map<string, DBDriver>): Promise<Map<string, DBDriver>> {
    const { driverList } = await this.graphQLService.gql.driverList();

    data.clear();

    for (const driver of driverList) {
      data.set(driver.id, driver);
    }

    return data;
  }

  private closeConnectionTabs(id: string) {
    // todo must be called from navigation service
    const activeTabs = this.navigationTabsService.tabIdList.filter(tabId => tabId.includes(id));
    for (const tabId of activeTabs) {
      this.navigationTabsService.closeTab(tabId); // here must be async, like when we want to show prompt 'save before close'
    }
  }

  /**
   * Note that this request returns either schemaList or catalogList. You never got both lists together
   */
  private async loadSchemasAndCatalogs(connectionId: string, catalogId?: string): Promise<NavGetStructContainersQuery> {
    return this.graphQLService.gql.navGetStructContainers({ connectionId, catalogId });
  }

  private restoreConnection(connectionInfo: ConnectionShortInfo) {
    const connection: Connection = {
      ...connectionInfo,
      connected: true,
    };
    this.connectionsMap.set(connection.id, connection);
    this.onOpenConnection.next(connection);
  }
}
