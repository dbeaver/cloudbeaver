/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import {
  ConnectionInfoResource,
  ConnectionsManagerService,
  ObjectContainer,
  DBDriverResource,
  isConnectionProvider, IConnectionProvider,
  isConnectionSetter, IConnectionSetter
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExtension } from '@cloudbeaver/core-extensions';

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

interface IActiveItem<T> {
  id: string;
  context: T;
  getCurrentConnectionId?: IConnectionProvider<T>;
  getCurrentSchemaId?: IObjectSchemaProvider<T>;
  getCurrentCatalogId?: IObjectCatalogProvider<T>;
  changeConnectionId?: IConnectionSetter<T>;
  changeCatalogId?: IObjectCatalogSetter<T>;
  changeSchemaId?: IObjectSchemaSetter<T>;
}

@injectable()
export class ConnectionSchemaManagerService {

  get currentConnectionId(): string | undefined {
    if (!this.activeItem?.getCurrentConnectionId) {
      return;
    }
    return this.activeItem.getCurrentConnectionId(this.activeItem.context);
  }

  get currentObjectCatalogId(): string | undefined {
    if (!this.activeItem?.getCurrentCatalogId) {
      return;
    }
    return this.activeItem.getCurrentCatalogId(this.activeItem.context);
  }

  get currentObjectSchemaId(): string | undefined {
    if (!this.activeItem?.getCurrentSchemaId) {
      return;
    }
    return this.activeItem.getCurrentSchemaId(this.activeItem.context);
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
    return !!this.activeItem?.changeConnectionId
      && !this.connectionsManagerService.connectionObjectContainers.isLoading();
  }

  get isObjectCatalogChangeable(): boolean {
    return !!this.activeItem?.changeCatalogId
      && !this.connectionsManagerService.connectionObjectContainers.isLoading();
  }

  get isObjectSchemaChangeable(): boolean {
    return !!this.activeItem?.changeSchemaId
      && !this.connectionsManagerService.connectionObjectContainers.isLoading();
  }

  @observable private activeItem: IActiveItem<any> | null = null;
  @observable private activeItemHistory: IActiveItem<any>[] = [];

  constructor(
    private navigationTabsService: NavigationTabsService,
    private connectionInfo: ConnectionInfoResource,
    private connectionsManagerService: ConnectionsManagerService,
    private dbDriverResource: DBDriverResource,
    private notificationService: NotificationService,
  ) {

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
    if (!this.activeItem?.changeConnectionId) {
      return;
    }
    this.activeItem.changeConnectionId(connectionId, this.activeItem.context);
    this.updateContainer(connectionId);
  }

  /**
   * Trigger when user select catalog in dropdown
   */
  selectCatalog(catalogId: string) {
    if (!this.activeItem?.changeCatalogId) {
      throw new Error('The try to change catalog without connection');
    }
    this.activeItem.changeCatalogId(catalogId, this.activeItem.context);
    this.updateContainer(this.currentConnectionId, catalogId);
  }

  /**
   * Trigger when user select schema in dropdown
   */
  selectSchema(schemaId: string) {
    if (!this.activeItem?.changeSchemaId) {
      throw new Error('The try to change schema without connection');
    }
    this.activeItem.changeSchemaId(schemaId, this.activeItem.context);
  }

  async updateContainer(connectionId?: string, catalogId?: string) {
    if (!connectionId) {
      connectionId = this.currentConnectionId;
    }
    if (!catalogId) {
      catalogId = this.currentObjectCatalogId;
    }
    if (!connectionId) {
      return;
    }

    try {
      await this.connectionInfo.load(connectionId);
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load connection info', true);
    }

    try {
      await this.dbDriverResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load database drivers', true);
    }

    if (this.activeItem?.changeCatalogId || this.activeItem?.changeSchemaId) {
      try {
        await this.connectionsManagerService.loadObjectContainer(connectionId, catalogId);
      } catch (exception) {
        this.notificationService.logException(
          exception,
          `Can't load objectContainers for ${connectionId}@${catalogId}`,
        );
      }
    }
  }

  private onTabSelect(tab: ITab) {
    const item: IActiveItem<ITab> = {
      id: tab.id,
      context: tab,
    };
    const handler = this.navigationTabsService.getTabHandler(tab.handlerId);

    if (handler && handler.extensions) {
      this.setExtensions(item, handler.extensions);
    }

    this.setActiveItem(item);
  }

  private onTabClose(tab: ITab) {
    this.removeActiveItem(tab.id);
  }

  private setExtensions<T>(item: IActiveItem<T>, extensions: IExtension<T>[]) {
    for (const extension of extensions) {
      if (isConnectionProvider(extension)) {
        item.getCurrentConnectionId = extension;
      }
      if (isObjectCatalogProvider(extension)) {
        item.getCurrentCatalogId = extension;
      }
      if (isObjectSchemaProvider(extension)) {
        item.getCurrentSchemaId = extension;
      }

      if (isConnectionSetter(extension)) {
        item.changeConnectionId = extension;
      }
      if (isObjectCatalogSetter(extension)) {
        item.changeCatalogId = extension;
      }
      if (isObjectSchemaSetter(extension)) {
        item.changeSchemaId = extension;
      }
    }
  }

  private removeActiveItem(id: string) {
    this.clearHistory(id);
    if (id === this.activeItem?.id) {
      this.setActiveItem(this.activeItemHistory.shift() ?? null);
    }
  }

  private setActiveItem(item: IActiveItem<any> | null) {
    if (!item) {
      this.activeItem = item;
      return;
    }
    this.clearHistory(item.id);
    this.activeItem = item;
    this.activeItemHistory.push(item);

    this.updateContainer();
  }

  private clearHistory(id: string) {
    this.activeItemHistory = this.activeItemHistory.filter(item => item.id !== id);
  }
}
