/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, makeObservable } from 'mobx';

import {
  ConnectionInfoResource,
  ConnectionsManagerService,
  ObjectContainer,
  DBDriverResource,
  isConnectionProvider, IConnectionProvider,
  isConnectionSetter, IConnectionSetter, IStructContainers, Connection
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExtensionUtils, IExtension } from '@cloudbeaver/core-extensions';

import type { ITab } from '../../shared/NavigationTabs/ITab';
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
  get currentConnectionId(): string | null | undefined {
    if (!this.activeItem?.getCurrentConnectionId) {
      return null;
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

  get currentConnection(): Connection | undefined {
    if (!this.currentConnectionId) {
      return;
    }

    return this.connectionInfo.get(this.currentConnectionId);
  }

  get currentObjectCatalog(): ObjectContainer | undefined {
    if (!this.currentConnectionId || !this.currentObjectCatalogId) {
      return;
    }

    return this.connectionsManagerService.getObjectContainerById(
      this.currentConnectionId,
      this.currentObjectCatalogId
    );
  }

  get currentObjectSchema(): ObjectContainer | undefined {
    if (!this.currentConnectionId || !this.currentObjectSchemaId || !this.currentObjectCatalogId) {
      return;
    }

    return this.connectionsManagerService.getObjectContainerById(
      this.currentConnectionId,
      this.currentObjectCatalogId,
      this.currentObjectSchemaId
    );
  }

  get objectContainerList(): IStructContainers | undefined {
    if (!this.currentConnectionId) {
      return;
    }

    return this.connectionsManagerService.connectionObjectContainers.get({
      connectionId: this.currentConnectionId,
      catalogId: this.currentObjectCatalogId,
    });
  }

  get isConnectionChangeable(): boolean {
    return !!this.activeItem?.changeConnectionId;
  }

  get isObjectCatalogChangeable(): boolean {
    return (
      !!this.activeItem?.changeCatalogId
      && !!this.objectContainerList?.supportsCatalogChange
    );
  }

  get isObjectSchemaChangeable(): boolean {
    return (
      !!this.activeItem?.changeSchemaId
      && !!this.objectContainerList?.supportsSchemaChange
    );
  }

  get isChangingConnection(): boolean {
    return this.changingConnection;
  }

  get isChangingConnectionContainer(): boolean {
    return this.changingConnectionContainer;
  }

  private changingConnection: boolean;
  private changingConnectionContainer: boolean;
  private activeItem: IActiveItem<any> | null = null;
  private activeItemHistory: Array<IActiveItem<any>> = [];

  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionInfo: ConnectionInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly notificationService: NotificationService
  ) {
    this.changingConnection = false;
    this.changingConnectionContainer = false;

    makeObservable<ConnectionSchemaManagerService, 'activeItem' | 'activeItemHistory' | 'changingConnection' | 'changingConnectionContainer'>(this, {
      currentObjectCatalog: computed,
      currentObjectSchema: computed,
      objectContainerList: computed,
      currentConnectionId: computed,
      currentObjectCatalogId: computed,
      currentObjectSchemaId: computed,
      isConnectionChangeable: computed,
      isObjectCatalogChangeable: computed,
      isObjectSchemaChangeable: computed,
      changingConnection: observable,
      changingConnectionContainer: observable,
      activeItem: observable,
      activeItemHistory: observable,
    });
  }

  /**
   * Trigger when user select connection in dropdown
   */
  async selectConnection(connectionId: string): Promise<void> {
    if (!this.activeItem?.changeConnectionId) {
      return;
    }
    try {
      this.changingConnection = true;
      await this.activeItem.changeConnectionId(connectionId, this.activeItem.context);
      await this.updateContainer(connectionId);
    } finally {
      this.changingConnection = false;
    }
  }

  async onConnectionUpdate(): Promise<void> {
    await this.updateContainer(this.currentConnectionId);
  }

  /**
   * Trigger when user select catalog in dropdown
   */
  async selectCatalog(catalogId: string): Promise<void> {
    if (!this.activeItem?.changeCatalogId) {
      throw new Error('The try to change catalog without connection');
    }

    try {
      this.changingConnectionContainer = true;
      await this.activeItem.changeCatalogId(catalogId, this.activeItem.context);
      await this.updateContainer(this.currentConnectionId, catalogId);
    } finally {
      this.changingConnectionContainer = false;
    }
  }

  /**
   * Trigger when user select schema in dropdown
   */
  async selectSchema(schemaId: string): Promise<void> {
    if (!this.activeItem?.changeSchemaId) {
      throw new Error('The try to change schema without connection');
    }
    try {
      this.changingConnectionContainer = true;
      await this.activeItem.changeSchemaId(schemaId, this.activeItem.context);
    } finally {
      this.changingConnectionContainer = false;
    }
  }

  reset() {
    this.activeItem = null;
    this.activeItemHistory = [];
  }

  onTabSelect(tab: ITab) {
    const item: IActiveItem<ITab> = {
      id: tab.id,
      context: tab,
    };
    const handler = this.navigationTabsService.getTabHandler(tab.handlerId);

    if (handler?.extensions) {
      this.setExtensions(item, handler.extensions);
    }

    this.setActiveItem(item);
  }

  onTabClose(tab: ITab | undefined) {
    if (!tab) {
      return;
    }
    this.removeActiveItem(tab.id);
  }

  private async updateContainer(connectionId?: string | null, catalogId?: string): Promise<void> {
    if (!connectionId) {
      connectionId = this.currentConnectionId;
    }
    if (!catalogId) {
      catalogId = this.currentObjectCatalogId;
    }
    if (!connectionId) {
      return;
    }

    const connection = this.connectionInfo.get(connectionId);

    if (!connection) {
      console.warn(`Connection Schema Manager: connection (${connectionId}) not exists`);
      return;
    }

    try {
      await this.dbDriverResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load database drivers', '', true);
    }

    if (!connection.connected) {
      return;
    }

    try {
      await this.connectionsManagerService.loadObjectContainer(connectionId, catalogId);
    } catch (exception) {
      this.notificationService.logException(
        exception,
        `Can't load objectContainers for ${connectionId}@${catalogId}`,
        '',
        true
      );
    }
  }

  private setExtensions<T>(item: IActiveItem<T>, extensions: Array<IExtension<T>>) {
    ExtensionUtils.from(extensions)
      .on(isConnectionProvider, extension => { item.getCurrentConnectionId = extension; })
      .on(isObjectCatalogProvider, extension => { item.getCurrentCatalogId = extension; })
      .on(isObjectSchemaProvider, extension => { item.getCurrentSchemaId = extension; })

      .on(isConnectionSetter, extension => { item.changeConnectionId = extension; })
      .on(isObjectCatalogSetter, extension => { item.changeCatalogId = extension; })
      .on(isObjectSchemaSetter, extension => { item.changeSchemaId = extension; });
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
