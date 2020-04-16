/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import {
  Connection,
  ConnectionsManagerService,
  ISchema,
} from '../../shared/ConnectionsManager/ConnectionsManagerService';
import { NavigationTabsService } from '../../shared/NavigationTabs/NavigationTabsService';
import { NodeManagerUtils } from '../../shared/NodesManager/NodeManagerUtils';
import { NodesManagerService } from '../../shared/NodesManager/NodesManagerService';
import { ConnectionSchemaStore, IConnectionWithIcon } from './ConnectionSchemaStore';
import { IConnectionCatalogSchema, ITabHasConnectionChangeBehavior } from './IConnectionCatalogSchema';

@injectable()
export class ConnectionSchemaManagerService {

  get currentConnection() {
    return this.currentTabState
      ? this.store.getConnectionById(this.currentTabState.connectionId) : null;
  }

  get schemaList(): ISchema[] {
    return this.store.schemaList;
  }
  get connectionsList() {
    return this.store.connectionsList;
  }
  get catalogsList() {
    return this.store.catalogsList;
  }

  @computed get connectionSelectionDisabled(): boolean {
    return !this.isTabStateChangeable
      || this.connectionsList.length === 0;
  }

  @computed get isTabStateChangeable(): boolean {
    return Boolean(this.currentTabState && this.currentTabState.changeSchema);
  }

  @computed get isSelectorVisible(): boolean {
    return Boolean(this.currentTabState);
  }

  @computed get currentTabState(): ITabHasConnectionChangeBehavior | null {
    const tab = this.navigationTabsService.getTab(this.navigationTabsService.currentTabId);
    if (!tab) {
      return null;
    }
    // todo everything here should be refactored and moved to a specific tab strategy
    const sqlHandlerState = tab.getHandlerState<ITabHasConnectionChangeBehavior>('sql_editor');
    if (sqlHandlerState) {
      return sqlHandlerState;
    }

    const isObjectViewer = tab.hasHandler('object_viewer_properties') || tab.hasHandler('data_viewer_data');
    if (isObjectViewer) {
      const connectionAndSchema = this.nodesManagerService.getConnectionCatalogSchema(tab.nodeId);
      if (connectionAndSchema.connectionId) {
        // connection node id differs from connection id
        const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(connectionAndSchema.connectionId);
        return {
          connectionId,
          schemaId: connectionAndSchema.schemaId || null,
          catalogId: connectionAndSchema.catalogId || null,
        };
      }
    }
    return null;
  }

  private store = new ConnectionSchemaStore();

  constructor(private navigationTabsService: NavigationTabsService,
              private nodesManagerService: NodesManagerService,
              private connectionsManagerService: ConnectionsManagerService,
              private notificationService: NotificationService) {

    this.connectionsManagerService.connections.forEach((connection) => {
      this.addConnectionToList(connection);
    });

    this.connectionsManagerService.onOpenConnection
      .subscribe((connection) => {
        this.addConnectionToList(connection);
      });

    this.connectionsManagerService.onCloseConnection
      .subscribe((connectionId) => {
        this.removeConnectionFromList(connectionId);
      });

    this.navigationTabsService.onTabActivate
      .subscribe(tab => this.onTabActivate());
    this.onTabActivate();
  }

  /**
   * Trigger when user select connection in dropdown
   */
  onSelectConnection(connection: IConnectionWithIcon) {
    if (!this.currentTabState) {
      return;
    }
    if (this.currentTabState.connectionId === connection.id) {
      return;
    }
    this.changeTabConnection({
      connectionId: connection.id,
      catalogId: null,
      schemaId: null,
    });
  }

  /**
   * Trigger when user select schema in dropdown
   */
  onSelectSchema(schemaId: string) {
    if (!this.currentConnection) {
      throw new Error('The try to change schema without connection');
    }
    if (this.currentTabState?.schemaId === schemaId) {
      return;
    }

    const params = {
      connectionId: this.currentConnection.id,
      catalogId: this.currentTabState?.catalogId || null,
      schemaId,
    };
    this.changeTabConnection(params);
  }

  /**
   * Trigger when user select catalog in dropdown
   */
  onSelectCatalog(catalogId: string) {
    if (!this.currentConnection) {
      throw new Error('The try to change schema without connection');
    }
    if (this.currentTabState?.catalogId === catalogId) {
      return;
    }

    const params = {
      connectionId: this.currentConnection.id,
      catalogId,
      schemaId: null,
    };
    this.changeTabConnection(params);
  }

  private onTabActivate() {
    if (this.currentTabState && this.isTabStateChangeable) {
      this.refreshSchemasList(this.currentTabState.connectionId, this.currentTabState.catalogId);
    }
  }

  private async changeTabConnection(connectionCatalogSchema: IConnectionCatalogSchema): Promise<void> {

    if (!this.currentTabState || !this.currentTabState.changeSchema) {
      return;
    }

    const currentConnectionId = this.currentTabState.connectionId;
    const currentCatalogId = this.currentTabState.catalogId;

    const res = await this.currentTabState.changeSchema(connectionCatalogSchema);

    if (currentConnectionId !== res.connectionId || currentCatalogId !== res.catalogId) {
      this.refreshSchemasList(res.connectionId, res.catalogId);
    }

  }

  private addConnectionToList(connection: Connection) {
    this.store.addConnection({
      ...connection,
      icon: '',
    });
    this.loadIcon(connection);
  }

  private async loadIcon(connection: Connection): Promise<void> {
    try {
      const res = await this.connectionsManagerService.loadConnectionDriver(connection.driverId);
      this.store.updateIcon(connection.id, res?.icon);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load icon for driver: ${connection.driverId}`);
    }
  }

  private removeConnectionFromList(connectionId: string) {
    this.store.removeConnection(connectionId);
  }

  private async refreshSchemasList(connectionId: string, catalogId: string | null) {
    if (this.store.listsParams.connectionId === connectionId
      && this.store.listsParams.catalogId === catalogId) {
      return;
    }
    // hide non-actual data while loading
    this.store.setSchemasAndCatalogs(
      {
        connectionId: null,
        catalogId: null,
      },
      {
        catalogs: [],
        schemas: [],
      }
    );

    const catalogAndSchemas = await this.connectionsManagerService
      .getCatalogsAndSchemas(connectionId, catalogId || undefined);

    this.store.setSchemasAndCatalogs(
      {
        connectionId,
        catalogId: catalogId || null,
      },
      catalogAndSchemas
    );
  }
}
