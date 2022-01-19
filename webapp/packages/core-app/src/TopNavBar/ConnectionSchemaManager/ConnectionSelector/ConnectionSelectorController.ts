/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import {
  ConnectionInfoResource,
  DBDriverResource,
  Connection,
  ConnectionsManagerService,
  compareConnectionsInfo
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ComputedMenuItemModel, ComputedMenuPanelModel, IMenuItem } from '@cloudbeaver/core-dialogs';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { ConnectionSchemaManagerService } from '../ConnectionSchemaManagerService';

@injectable()
export class ConnectionSelectorController {
  connectionMenu: IMenuItem;
  objectContainerMenu: IMenuItem;

  get currentConnection(): Connection | undefined {
    if (!this.connectionSelectorService.currentConnectionId) {
      return;
    }

    return this.connectionInfo.get(
      this.connectionSelectorService.currentConnectionId
    );
  }

  get currentConnectionIcon(): string | undefined {
    if (!this.currentConnection) {
      return;
    }
    const driverIcon = this.dbDriverResource.get(this.currentConnection.driverId)?.icon;
    return driverIcon;
  }

  get isConnectionSelectorVisible(): boolean {
    return (
      !this.optionsPanelService.active
      && (
        this.connectionSelectorService.currentConnectionId !== null
        || this.connectionSelectorService.isConnectionChangeable
      )
    );
  }

  get isObjectContainerSelectorVisible(): boolean {
    return (
      !!this.currentConnection?.connected
      && (
        this.connectionSelectorService.currentObjectSchemaId !== undefined
        || this.connectionSelectorService.currentObjectCatalogId !== undefined
      )
      && (
        !!this.connectionSelectorService.objectContainerList?.supportsCatalogChange
        || !!this.connectionSelectorService.objectContainerList?.supportsSchemaChange
      )
    );
  }

  get objectContainerSelectionDisabled(): boolean {
    return !this.connectionSelectorService.isConnectionChangeable
      || this.getObjectContainerItems().length === 0;
  }

  private get currentConnectionTitle(): string {
    if (this.currentConnection) {
      return this.currentConnection.name;
    }
    return 'app_topnavbar_connection_schema_manager_not_selected';
  }

  private get currentObjectContainerTitle(): string {
    const value = NodeManagerUtils.concatSchemaAndCatalog(
      this.connectionSelectorService.currentObjectCatalogId,
      this.connectionSelectorService.currentObjectSchemaId
    );

    if (!value) {
      return 'app_topnavbar_connection_schema_manager_not_selected';
    }

    return value;
  }

  private get currentObjectContainerIcon(): string {
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
    private readonly connectionSelectorService: ConnectionSchemaManagerService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionInfo: ConnectionInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly optionsPanelService: OptionsPanelService,
  ) {
    makeObservable<ConnectionSelectorController, 'currentObjectContainerIcon'>(this, {
      currentConnection: computed,
      currentConnectionIcon: computed,
      objectContainerSelectionDisabled: computed,
      currentObjectContainerIcon: computed,
      isObjectContainerSelectorVisible: computed,
    });

    this.connectionMenu = new ComputedMenuItemModel({
      id: 'connectionsDropdown',
      isDisabled: () => !this.connectionSelectorService.isConnectionChangeable
        || !this.connectionsManagerService.hasAnyConnection(),
      titleGetter: () => this.currentConnectionTitle,
      iconGetter: () => this.currentConnectionIcon,
      panel: new ComputedMenuPanelModel({
        id: 'connectionsDropdownPanel',
        menuItemsGetter: () => this.getConnectionItems(),
      }),
    });

    this.objectContainerMenu = new ComputedMenuItemModel({
      id: 'objectContainerDropdown',
      isDisabled: () => this.objectContainerSelectionDisabled,
      titleGetter: () => this.currentObjectContainerTitle,
      iconGetter: () => this.currentObjectContainerIcon,
      panel: new ComputedMenuPanelModel({
        id: 'objectContainerDropdownPanel',
        menuItemsGetter: () => this.getObjectContainerItems(),
      }),
    });
  }

  private getConnectionItems(): IMenuItem[] {
    return this.connectionInfo.values
      .slice()
      .sort((a, b) => {
        if (a.connected === b.connected) {
          return compareConnectionsInfo(a, b);
        }

        return Number(b.connected) - Number(a.connected);
      })
      .map((item, index, array) => {
        const icon = this.dbDriverResource.get(item.driverId)?.icon;

        const menuItem: IMenuItem = {
          id: item.id,
          title: item.name || item.id,
          icon,
          onClick: () => this.connectionSelectorService.selectConnection(item.id),
        };

        const next = array[index + 1];
        if (item.connected && next && !next.connected) {
          menuItem.separator = true;
        }

        return menuItem;
      });
  }

  private getObjectContainerItems(): IMenuItem[] {
    if (!this.connectionSelectorService.objectContainerList) {
      return [];
    }

    const schemaList = this.connectionSelectorService.objectContainerList.schemaList
      .slice()
      .sort((a, b) => {
        if (a.name === b.name){
          return 0;
        }
      
        if (a.name === this.connectionSelectorService.currentObjectSchemaId) {
          return -1;
        }
      
        if (b.name === this.connectionSelectorService.currentObjectSchemaId) {
          return 1;
        }

        return 0;
      });

    const catalogList = this.connectionSelectorService.objectContainerList.catalogList
      .slice()
      .sort((a, b) => {
        if (a.catalog.name === b.catalog.name){
          return 0;
        }
        
        if (a.catalog.name === this.connectionSelectorService.currentObjectCatalogId) {
          return -1;
        }
        
        if (b.catalog.name === this.connectionSelectorService.currentObjectCatalogId) {
          return 1;
        }
  
        return 0;
      });

    const items: IMenuItem[] = [];

    for (const schema of schemaList) {
      if (!schema.name) {
        continue;
      }

      const title = schema.name;

      items.push({
        id: title,
        title,
        icon: 'schema_system',
        onClick: async () => {
          await this.connectionSelectorService.selectSchema(schema.name!);
        },
      });
    }

    for (const catalogData of catalogList) {
      const catalog = catalogData.catalog;
      if (!catalog.name) {
        continue;
      }

      if (catalogData.schemaList.length === 0) {
        items.push({
          id: catalog.name,
          title: catalog.name,
          icon: 'database',
          onClick: () => this.connectionSelectorService.selectCatalog(catalog.name!),
        });
      }

      for (const schema of catalogData.schemaList) {
        if (!schema.name) {
          continue;
        }

        const title = NodeManagerUtils.concatSchemaAndCatalog(
          catalog.name,
          schema.name
        );

        items.push({
          id: title,
          title,
          icon: 'schema_system',
          onClick: async () => {
            await this.connectionSelectorService.selectCatalog(catalog.name!);
            await this.connectionSelectorService.selectSchema(schema.name!);
          },
        });
      }
    }

    return items;
  }
}
