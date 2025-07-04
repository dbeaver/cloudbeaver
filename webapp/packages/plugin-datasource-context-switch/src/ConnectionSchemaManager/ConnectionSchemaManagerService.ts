/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import {
  type Connection,
  ConnectionInfoResource,
  ConnectionsManagerService,
  DBDriverResource,
  type IConnectionInfoParams,
  type IConnectionProvider,
  type IConnectionSetter,
  type IExecutionContextProvider,
  type IObjectCatalogProvider,
  type IObjectCatalogSetter,
  type IObjectLoaderProvider,
  type IObjectSchemaProvider,
  type IObjectSchemaSetter,
  isConnectionProvider,
  isConnectionSetter,
  isExecutionContextProvider,
  isObjectCatalogProvider,
  isObjectCatalogSetter,
  isObjectLoaderProvider,
  isObjectSchemaProvider,
  isObjectSchemaSetter,
  type IStructContainers,
  type ObjectContainer,
  serializeConnectionParam,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExtensionUtils, type IExtension } from '@cloudbeaver/core-extensions';
import { type IDataContextActiveNode, type IObjectNavNodeProvider, isObjectNavNodeProvider } from '@cloudbeaver/core-navigation-tree';
import {
  type IProjectProvider,
  type IProjectSetter,
  type IProjectSetterState,
  isProjectProvider,
  isProjectSetter,
  isProjectSetterState,
} from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { ILoadableState } from '@cloudbeaver/core-utils';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

export interface IConnectionInfo {
  name?: string;
  driverIcon?: string;
}

interface IActiveItem<T> {
  id: string;
  context: T;
  getCurrentNavNode?: IObjectNavNodeProvider<T>;
  getProjectSetterState?: IProjectSetterState<T>;
  getCurrentProjectId?: IProjectProvider<T>;
  getCurrentConnectionId?: IConnectionProvider<T>;
  getCurrentSchemaId?: IObjectSchemaProvider<T>;
  getCurrentCatalogId?: IObjectCatalogProvider<T>;
  getCurrentExecutionContext?: IExecutionContextProvider<T>;
  getCurrentLoader?: IObjectLoaderProvider<T>;
  changeConnectionId?: IConnectionSetter<T>;
  changeProjectId?: IProjectSetter<T>;
  changeCatalogId?: IObjectCatalogSetter<T>;
  changeSchemaId?: IObjectSchemaSetter<T>;
}

@injectable()
export class ConnectionSchemaManagerService {
  get activeNavNode(): IDataContextActiveNode | null | undefined {
    if (!this.activeItem?.getCurrentNavNode) {
      return null;
    }

    return this.activeItem.getCurrentNavNode(this.activeItem.context);
  }

  get activeProjectId(): string | null | undefined {
    if (!this.activeItem?.getCurrentProjectId) {
      return null;
    }

    return this.activeItem.getCurrentProjectId(this.activeItem.context);
  }

  get activeConnectionKey(): IConnectionInfoParams | null | undefined {
    if (!this.activeItem?.getCurrentConnectionId) {
      return null;
    }

    return this.activeItem.getCurrentConnectionId(this.activeItem.context);
  }

  get currentProjectId(): string | null | undefined {
    if (this.pendingProjectId !== null) {
      return this.pendingProjectId;
    }

    return this.activeProjectId;
  }

  get currentConnectionKey(): IConnectionInfoParams | null | undefined {
    if (this.pendingConnectionKey !== null) {
      return this.pendingConnectionKey;
    }

    return this.activeConnectionKey;
  }

  get activeObjectCatalogId(): string | undefined {
    if (!this.activeItem?.getCurrentCatalogId) {
      return;
    }

    return this.activeItem.getCurrentCatalogId(this.activeItem.context);
  }

  get currentObjectCatalogId(): string | undefined {
    if (this.pendingCatalogId !== null) {
      return this.pendingCatalogId;
    }
    return this.activeObjectCatalogId;
  }

  get activeExecutionContext() {
    if (!this.activeItem?.getCurrentExecutionContext) {
      return;
    }

    return this.activeItem.getCurrentExecutionContext(this.activeItem.context);
  }

  get currentObjectLoaders(): ILoadableState[] {
    if (!this.activeItem?.getCurrentLoader) {
      return [];
    }

    return this.activeItem.getCurrentLoader(this.activeItem.context);
  }

  get currentObjectSchemaId(): string | undefined {
    if (this.pendingSchemaId !== null) {
      return this.pendingSchemaId;
    }

    if (!this.activeItem?.getCurrentSchemaId) {
      return;
    }

    return this.activeItem.getCurrentSchemaId(this.activeItem.context);
  }

  get currentConnection(): Connection | undefined {
    if (!this.currentConnectionKey) {
      return;
    }

    return this.connectionInfoResource.get(this.currentConnectionKey);
  }

  get currentObjectCatalog(): ObjectContainer | undefined {
    if (!this.currentConnectionKey || !this.currentObjectCatalogId) {
      return;
    }

    return this.connectionsManagerService.getObjectContainerById(this.currentConnectionKey, this.currentObjectCatalogId);
  }

  get currentObjectSchema(): ObjectContainer | undefined {
    if (!this.currentConnectionKey || !this.currentObjectSchemaId) {
      return;
    }

    return this.connectionsManagerService.getObjectContainerById(this.currentConnectionKey, this.currentObjectCatalogId, this.currentObjectSchemaId);
  }

  get objectContainerList(): IStructContainers | undefined {
    if (!this.currentConnectionKey) {
      return;
    }

    return this.connectionsManagerService.containerContainers.get({
      ...this.currentConnectionKey,
      catalogId: this.currentObjectCatalogId,
    });
  }

  get isProjectChangeable(): boolean {
    return !!this.activeItem?.changeProjectId && !!this.activeItem.getProjectSetterState?.(this.activeItem.context);
  }

  get isConnectionChangeable(): boolean {
    return !!this.activeItem?.changeConnectionId;
  }

  get isObjectCatalogChangeable(): boolean {
    return !!this.activeItem?.changeCatalogId && !!this.objectContainerList?.supportsCatalogChange;
  }

  get isObjectSchemaChangeable(): boolean {
    return !!this.activeItem?.changeSchemaId && !!this.objectContainerList?.supportsSchemaChange;
  }

  get isChangingProject(): boolean {
    return this.changingProjectId;
  }

  get isChangingConnection(): boolean {
    return this.changingConnection;
  }

  get isChangingConnectionContainer(): boolean {
    return this.changingConnectionContainer;
  }

  get activeItem(): IActiveItem<any> | null {
    const tab = this.navigationTabsService.currentTab;

    if (!tab) {
      return null;
    }

    const item: IActiveItem<ITab> = {
      id: tab.id,
      context: tab,
    };

    const handler = this.navigationTabsService.getTabHandler(tab.handlerId);

    if (handler?.extensions) {
      this.setExtensions(item, handler.extensions);
    }

    return item;
  }

  private pendingProjectId: string | null;
  private pendingConnectionKey: IConnectionInfoParams | null;
  private pendingCatalogId: string | null | undefined;
  private pendingSchemaId: string | null | undefined;
  private changingProjectId: boolean;
  private changingConnection: boolean;
  private changingConnectionContainer: boolean;

  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly notificationService: NotificationService,
  ) {
    this.changingProjectId = false;
    this.changingConnection = false;
    this.changingConnectionContainer = false;
    this.pendingConnectionKey = null;
    this.pendingProjectId = null;
    this.pendingCatalogId = null;
    this.pendingSchemaId = null;

    makeObservable<
      ConnectionSchemaManagerService,
      | 'activeItem'
      | 'changingProjectId'
      | 'changingConnection'
      | 'changingConnectionContainer'
      | 'pendingProjectId'
      | 'pendingConnectionKey'
      | 'pendingCatalogId'
      | 'pendingSchemaId'
      | 'setExtensions'
    >(this, {
      currentObjectCatalog: computed,
      currentObjectSchema: computed,
      objectContainerList: computed,
      currentConnectionKey: computed,
      activeConnectionKey: computed,
      currentObjectCatalogId: computed,
      activeObjectCatalogId: computed,
      currentObjectSchemaId: computed,
      currentObjectLoaders: computed,
      isConnectionChangeable: computed,
      isObjectCatalogChangeable: computed,
      isObjectSchemaChangeable: computed,
      activeItem: computed,
      changingProjectId: observable,
      changingConnection: observable,
      changingConnectionContainer: observable,
      pendingProjectId: observable,
      pendingConnectionKey: observable,
      pendingCatalogId: observable,
      pendingSchemaId: observable,
      setExtensions: action,
    });
  }

  async selectProjectId(projectId: string): Promise<void> {
    if (!this.activeItem?.changeProjectId) {
      return;
    }
    try {
      runInAction(() => {
        this.changingProjectId = true;
        this.pendingProjectId = projectId;
      });
      await this.activeItem.changeProjectId(projectId, this.activeItem.context);
    } finally {
      runInAction(() => {
        this.changingProjectId = false;
        this.pendingProjectId = null;
      });
    }
  }

  /**
   * Trigger when user select connection in dropdown
   */
  async selectConnection(connectionKey: IConnectionInfoParams): Promise<void> {
    if (!this.activeItem?.changeConnectionId) {
      return;
    }
    try {
      runInAction(() => {
        this.changingProjectId = true;
        this.changingConnection = true;
        this.pendingProjectId = connectionKey.projectId;
        this.pendingConnectionKey = connectionKey;
        this.pendingSchemaId = undefined;
        this.pendingCatalogId = undefined;
      });
      await this.activeItem.changeConnectionId(connectionKey, this.activeItem.context);
      await this.updateContainer(connectionKey);
    } finally {
      runInAction(() => {
        this.changingProjectId = false;
        this.changingConnection = false;
        this.pendingProjectId = null;
        this.pendingConnectionKey = null;
        this.pendingSchemaId = null;
        this.pendingCatalogId = null;
      });
    }
  }

  async onConnectionUpdate(): Promise<void> {
    await this.updateContainer(this.currentConnectionKey);
  }

  /**
   * Trigger when user select catalog in dropdown
   */
  async selectCatalog(catalogId: string, resetSchemaId = true): Promise<void> {
    if (!this.activeItem?.changeCatalogId) {
      throw new Error('The try to change catalog without connection');
    }

    try {
      runInAction(() => {
        this.changingConnectionContainer = true;
        this.pendingCatalogId = catalogId;

        if (resetSchemaId) {
          this.pendingSchemaId = undefined;
        }
      });

      await this.activeItem.changeCatalogId(catalogId, this.activeItem.context);
      await this.updateContainer(this.currentConnectionKey, catalogId);
    } finally {
      runInAction(() => {
        if (resetSchemaId) {
          this.pendingSchemaId = null;
        }
        this.pendingCatalogId = null;
        this.changingConnectionContainer = false;
      });
    }
  }

  /**
   * Trigger when user select schema in dropdown
   */
  async selectSchema(schemaId: string, catalogId?: string): Promise<void> {
    if (!this.activeItem?.changeSchemaId) {
      throw new Error('The try to change schema without connection');
    }

    try {
      runInAction(() => {
        this.changingConnectionContainer = true;
        this.pendingSchemaId = schemaId;
      });

      if (catalogId) {
        await this.selectCatalog(catalogId, false);
      }

      await this.activeItem.changeSchemaId(schemaId, this.activeItem.context);
    } finally {
      runInAction(() => {
        this.pendingSchemaId = null;
        this.changingConnectionContainer = false;
      });
    }
  }

  async updateContainer(key?: IConnectionInfoParams | null, catalogId?: string): Promise<void> {
    if (!key) {
      key = this.currentConnectionKey;
    }

    if (!catalogId) {
      catalogId = this.currentObjectCatalogId;
    }

    if (!key) {
      return;
    }

    const connection = this.connectionInfoResource.get(key);

    if (!connection) {
      console.warn(`Connection Schema Manager: connection (${serializeConnectionParam(key)}) not exists`);
      return;
    }

    try {
      await this.dbDriverResource.load(CachedMapAllKey);
    } catch (exception: any) {
      this.notificationService.logException(exception, "Can't load database drivers", '', true);
    }

    if (!connection.connected) {
      return;
    }

    try {
      await this.connectionsManagerService.loadObjectContainer(key, catalogId);
    } catch (exception: any) {
      this.notificationService.logException(exception, `Can't load objectContainers for ${serializeConnectionParam(key)}@${catalogId}`, '', true);
    }
  }

  private setExtensions<T>(item: IActiveItem<T>, extensions: Array<IExtension<T>>) {
    ExtensionUtils.from(extensions)
      .on(isObjectNavNodeProvider, extension => {
        item.getCurrentNavNode = extension;
      })
      .on(isProjectSetterState, extension => {
        item.getProjectSetterState = extension;
      })
      .on(isProjectProvider, extension => {
        item.getCurrentProjectId = extension;
      })
      .on(isConnectionProvider, extension => {
        item.getCurrentConnectionId = extension;
      })
      .on(isObjectCatalogProvider, extension => {
        item.getCurrentCatalogId = extension;
      })
      .on(isObjectSchemaProvider, extension => {
        item.getCurrentSchemaId = extension;
      })
      .on(isExecutionContextProvider, extension => {
        item.getCurrentExecutionContext = extension;
      })
      .on(isObjectLoaderProvider, extension => {
        item.getCurrentLoader = extension;
      })

      .on(isProjectSetter, extension => {
        item.changeProjectId = extension;
      })
      .on(isConnectionSetter, extension => {
        item.changeConnectionId = extension;
      })
      .on(isObjectCatalogSetter, extension => {
        item.changeCatalogId = extension;
      })
      .on(isObjectSchemaSetter, extension => {
        item.changeSchemaId = extension;
      });
  }
}
