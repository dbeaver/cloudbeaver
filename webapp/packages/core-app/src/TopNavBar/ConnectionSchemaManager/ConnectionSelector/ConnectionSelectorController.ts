/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import {
  ConnectionInfoResource,
  DBDriverResource,
  Connection
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ComputedMenuItemModel, ComputedMenuPanelModel, IMenuItem } from '@cloudbeaver/core-dialogs';

import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { ConnectionSchemaManagerService } from '../ConnectionSchemaManagerService';

@injectable()
export class ConnectionSelectorController {

  connectionMenu: IMenuItem;
  objectContainerMenu: IMenuItem;

  @computed get currentConnection(): Connection | undefined {
    if (!this.connectionSelectorService.currentConnectionId) {
      return;
    }

    return this.connectionInfo.get(
      this.connectionSelectorService.currentConnectionId
    );
  }

  @computed get currentConnectionIcon(): string | undefined {
    if (!this.currentConnection) {
      return;
    }
    const driverIcon = this.dbDriverResource.get(this.currentConnection.driverId)?.icon;
    return driverIcon;
  }

  get isConnectionSelectorVisible() {
    return !!this.currentConnection;
  }
  get isObjectContainerSelectorVisible() {
    return !!this.connectionSelectorService.currentObjectCatalogId
      || !!this.connectionSelectorService.currentObjectSchemaId;
  }

  @computed get objectContainerSelectionDisabled(): boolean {
    return !this.connectionSelectorService.isConnectionChangeable
      || this.getObjectContainerItems().length === 0;
  }

  private get currentObjectContainerTitle(): string | undefined {
    return NodeManagerUtils.concatSchemaAndCatalog(
      this.connectionSelectorService.currentObjectCatalogId,
      this.connectionSelectorService.currentObjectSchemaId
    );
  }

  @computed private get currentObjectContainerIcon(): string {
    if (this.connectionSelectorService.currentObjectSchema?.features?.includes(EObjectFeature.schema)) {
    // TODO move such kind of icon paths to a set of constants
      return 'schema_system';
    }
    if (this.connectionSelectorService.currentObjectCatalog?.features?.includes(EObjectFeature.catalog)) {
      return 'database';
    }
    return 'database';
  }

  constructor(
    private connectionSelectorService: ConnectionSchemaManagerService,
    private dbDriverResource: DBDriverResource,
    private connectionInfo: ConnectionInfoResource,
  ) {

    this.connectionMenu = new ComputedMenuItemModel({
      id: 'connectionsDropdown',
      isDisabled: () => !this.connectionSelectorService.isConnectionChangeable,
      titleGetter: () => this.currentConnection?.name,
      iconGetter: () => this.currentConnectionIcon,
      panel: new ComputedMenuPanelModel({
        id: 'connectionsDropdownPanel',
        menuItemsGetter: () => this.getConnectionItems(),
      }),
    });

    this.objectContainerMenu = new ComputedMenuItemModel({
      id: 'connectionsDropdown',
      isDisabled: () => this.objectContainerSelectionDisabled,
      titleGetter: () => this.currentObjectContainerTitle,
      iconGetter: () => this.currentObjectContainerIcon,
      panel: new ComputedMenuPanelModel({
        id: 'connectionsDropdownPanel',
        menuItemsGetter: () => this.getObjectContainerItems(),
      }),
    });
  }

  private getConnectionItems(): IMenuItem[] {
    return Array.from(this.connectionInfo.data.values()).map((item) => {
      const menuItem: IMenuItem = {
        id: item.id,
        title: item.name || item.id,
        onClick: () => this.connectionSelectorService.selectConnection(item.id),
      };
      return menuItem;
    });
  }

  private getObjectContainerItems(): IMenuItem[] {
    if (!this.connectionSelectorService.objectContainerList) {
      return [];
    }
    return this.connectionSelectorService.objectContainerList
      .filter(item => !!item.name)
      .map((item) => {
        if (item.features?.includes(EObjectFeature.catalog)) {
          const title = NodeManagerUtils.concatSchemaAndCatalog(
            item.name,
            this.connectionSelectorService.currentObjectSchemaId
          );
          const handler = item.features?.includes(EObjectFeature.catalog)
            ? () => this.connectionSelectorService.selectCatalog(item.name!)
            : () => this.connectionSelectorService.selectSchema(item.name!);

          const menuItem: IMenuItem = {
            id: item.name!,
            title,
            onClick: handler,
          };
          return menuItem;
        }

        const title = NodeManagerUtils.concatSchemaAndCatalog(
          this.connectionSelectorService.currentObjectCatalogId,
          item.name
        );
        const handler = item.features?.includes(EObjectFeature.catalog)
          ? () => this.connectionSelectorService.selectCatalog(item.name!)
          : () => this.connectionSelectorService.selectSchema(item.name!);

        const menuItem: IMenuItem = {
          id: item.name!,
          title,
          onClick: handler,
        };
        return menuItem;
      });
  }
}
