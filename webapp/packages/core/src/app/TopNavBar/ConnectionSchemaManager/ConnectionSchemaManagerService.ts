/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { ConnectionsManagerService, ObjectContainer } from '../../shared/ConnectionsManager/ConnectionsManagerService';
import { isConnectionProvider, IConnectionProvider } from '../../shared/ConnectionsManager/extensions/IConnectionProvider';
import { isConnectionSetter, IConnectionSetter } from '../../shared/ConnectionsManager/extensions/IConnectionSetter';
import { ITab } from '../../shared/NavigationTabs/ITab';
import { NavigationTabsService } from '../../shared/NavigationTabs/NavigationTabsService';
import { IObjectCatalogProvider, isObjectCatalogProvider } from '../../shared/NodesManager/extensions/IObjectCatalogProvider';
import { IObjectCatalogSetter, isObjectCatalogSetter } from '../../shared/NodesManager/extensions/IObjectCatalogSetter';
import { IObjectSchemaProvider, isObjectSchemaProvider } from '../../shared/NodesManager/extensions/IObjectSchemaProvider';
import { IObjectSchemaSetter, isObjectSchemaSetter } from '../../shared/NodesManager/extensions/IObjectSchemaSetter';

export interface IConnectionInfo {
  name?: string;
  driverIcon?: string;
}

@injectable()
export class ConnectionSchemaManagerService {

  get currentConnectionId(): string | undefined {
    if (!this.getCurrentConnectionId || !this.currentTab) {
      return;
    }
    return this.getCurrentConnectionId(this.currentTab);
  }

  get currentObjectCatalogId(): string | undefined {
    if (!this.getCurrentCatalogId || !this.currentTab) {
      return;
    }
    return this.getCurrentCatalogId(this.currentTab);
  }

  get currentObjectSchemaId(): string | undefined {
    if (!this.getCurrentSchemaId || !this.currentTab) {
      return;
    }
    return this.getCurrentSchemaId(this.currentTab);
  }

  @computed get currentObjectCatalog(): ObjectContainer | undefined {
    if (!this.currentConnectionId || !this.currentObjectCatalogId) {
      return;
    }

    return this.connectionsManagerService.getObjectContainerById(
      this.currentConnectionId,
      this.currentObjectCatalogId
    );
  }

  @computed get currentObjectSchema(): ObjectContainer | undefined {
    if (!this.currentConnectionId || !this.currentObjectSchemaId || !this.currentObjectCatalogId) {
      return;
    }

    return this.connectionsManagerService.getObjectContainerById(
      this.currentConnectionId,
      this.currentObjectCatalogId,
      this.currentObjectSchemaId
    );
  }

  @computed get objectContainerList(): ObjectContainer[] | undefined {
    if (!this.currentConnectionId) {
      return;
    }

    return this.connectionsManagerService.connectionObjectContainers.data.get(this.currentConnectionId);
  }

  get isConnectionChangeable(): boolean {
    return !!this.changeConnectionId
      && !this.connectionsManagerService.connectionObjectContainers.isLoading();
  }

  get isObjectCatalogChangeable(): boolean {
    return !!this.changeCatalogId
      && !this.connectionsManagerService.connectionObjectContainers.isLoading();
  }

  get isObjectSchemaChangeable(): boolean {
    return !!this.changeSchemaId
      && !this.connectionsManagerService.connectionObjectContainers.isLoading();
  }

  @observable private currentTab: ITab | null = null;
  @observable private getCurrentConnectionId: IConnectionProvider<ITab> | null = null;
  @observable private getCurrentSchemaId: IObjectSchemaProvider<ITab> | null = null;
  @observable private getCurrentCatalogId: IObjectCatalogProvider<ITab> | null = null;
  @observable private changeConnectionId: IConnectionSetter<ITab> | null = null;
  @observable private changeCatalogId: IObjectCatalogSetter<ITab> | null = null;
  @observable private changeSchemaId: IObjectSchemaSetter<ITab> | null = null;

  constructor(private navigationTabsService: NavigationTabsService,
              private connectionsManagerService: ConnectionsManagerService,
              private notificationService: NotificationService) {

  }

  registerCallbacks() {
    this.navigationTabsService.onTabSelect
      .subscribe(this.onTabSelect.bind(this));

    this.navigationTabsService.onTabClose
      .subscribe(this.onTabClose.bind(this));
  }

  /**
   * Trigger when user select connection in dropdown
   */
  async selectConnection(connectionId: string) {
    if (!this.changeConnectionId || !this.currentTab) {
      return;
    }
    this.changeConnectionId(connectionId, this.currentTab);
    this.loadConnection(connectionId);
  }

  /**
   * Trigger when user select catalog in dropdown
   */
  selectCatalog(catalogId: string) {
    if (!this.changeCatalogId || !this.currentTab) {
      throw new Error('The try to change catalog without connection');
    }
    this.changeCatalogId(catalogId, this.currentTab);
    this.loadConnection(this.currentConnectionId!, catalogId);
  }

  /**
   * Trigger when user select schema in dropdown
   */
  selectSchema(schemaId: string) {
    if (!this.changeSchemaId || !this.currentTab) {
      throw new Error('The try to change schema without connection');
    }
    this.changeSchemaId(schemaId, this.currentTab);
  }

  private onTabSelect(tab: ITab) {
    this.clear();
    this.currentTab = tab;
    const handler = this.navigationTabsService.getTabHandler(tab.handlerId);

    if (handler && handler.extensions) {
      for (const extension of handler.extensions) {
        if (isConnectionProvider(extension)) {
          this.getCurrentConnectionId = extension;
        }
        if (isObjectCatalogProvider(extension)) {
          this.getCurrentCatalogId = extension;
        }
        if (isObjectSchemaProvider(extension)) {
          this.getCurrentSchemaId = extension;
        }

        if (isConnectionSetter(extension)) {
          this.changeConnectionId = extension;
        }
        if (isObjectCatalogSetter(extension)) {
          this.changeCatalogId = extension;
        }
        if (isObjectSchemaSetter(extension)) {
          this.changeSchemaId = extension;
        }
      }
    }

    if (this.currentConnectionId) {
      this.loadConnection(this.currentConnectionId, this.currentObjectCatalogId);
    }
  }

  private onTabClose(tab: ITab) {
    if (tab.id === this.currentTab?.id) {
      this.clear();
    }
  }

  private clear() {
    this.getCurrentConnectionId = null;
    this.getCurrentCatalogId = null;
    this.getCurrentSchemaId = null;
    this.changeConnectionId = null;
    this.changeCatalogId = null;
    this.changeSchemaId = null;
    this.currentTab = null;
  }

  private async loadConnection(connectionId: string, catalogId?: string) {

    try {
      await this.connectionsManagerService.dbDrivers.load();
      await this.connectionsManagerService.loadObjectContainer(connectionId, catalogId);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load connection: ${connectionId}`);
    }
  }
}
