/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
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
import { ExtensionUtils, IExtension } from '@cloudbeaver/core-extensions';

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

    return this.connectionsManagerService.connectionObjectContainers.get({
      connectionId: this.currentConnectionId,
      catalogId: this.currentObjectCatalogId,
    });
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
  @observable private activeItemHistory: Array<IActiveItem<any>> = [];

  constructor(
    private navigationTabsService: NavigationTabsService,
    private connectionInfo: ConnectionInfoResource,
    private connectionsManagerService: ConnectionsManagerService,
    private dbDriverResource: DBDriverResource,
    private notificationService: NotificationService,
    private appAuthService: AppAuthService
  ) {
  }

  registerCallbacks(): void {
    this.navigationTabsService.onTabSelect
      .subscribe(this.onTabSelect.bind(this));

    this.navigationTabsService.onTabClose
      .subscribe(this.onTabClose.bind(this));

    this.appAuthService.auth.addHandler(() => this.reset());
  }

  /**
   * Trigger when user select connection in dropdown
   */
  async selectConnection(connectionId: string): Promise<void> {
    if (!this.activeItem?.changeConnectionId) {
      return;
    }
    await this.activeItem.changeConnectionId(connectionId, this.activeItem.context);
    await this.updateContainer(connectionId);
  }

  /**
   * Trigger when user select catalog in dropdown
   */
  async selectCatalog(catalogId: string): Promise<void> {
    if (!this.activeItem?.changeCatalogId) {
      throw new Error('The try to change catalog without connection');
    }
    await this.activeItem.changeCatalogId(catalogId, this.activeItem.context);
    await this.updateContainer(this.currentConnectionId, catalogId);
  }

  /**
   * Trigger when user select schema in dropdown
   */
  async selectSchema(schemaId: string): Promise<void> {
    if (!this.activeItem?.changeSchemaId) {
      throw new Error('The try to change schema without connection');
    }
    await this.activeItem.changeSchemaId(schemaId, this.activeItem.context);
  }

  private reset() {
    this.activeItem = null;
    this.activeItemHistory = [];
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

  private onTabSelect(tab: ITab) {
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

  private onTabClose(tab: ITab | undefined) {
    if (!tab) {
      return;
    }
    this.removeActiveItem(tab.id);
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
