/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
        || (
          this.connectionSelectorService.currentConnectionId === null
          && this.connectionSelectorService.isConnectionChangeable
        )
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
    private connectionSelectorService: ConnectionSchemaManagerService,
    private dbDriverResource: DBDriverResource,
    private connectionInfo: ConnectionInfoResource,
    private connectionsManagerService: ConnectionsManagerService,
    private optionsPanelService: OptionsPanelService,
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
      .sort(compareConnectionsInfo)
      .map(item => {
        const icon = this.dbDriverResource.get(item.driverId)?.icon;

        const menuItem: IMenuItem = {
          id: item.id,
          title: item.name || item.id,
          icon,
          onClick: () => this.connectionSelectorService.selectConnection(item.id),
        };
        return menuItem;
      });
  }

  private getObjectContainerItems(): IMenuItem[] {
    if (!this.connectionSelectorService.objectContainerList) {
      return [];
    }

    const list = this.connectionSelectorService.objectContainerList
      .filter(item => !!item.name)
      .map(item => {
        const isCatalog = item.features?.includes(EObjectFeature.catalog);
        const catalogName = isCatalog ? item.name : this.connectionSelectorService.currentObjectCatalogId;
        const schemaName = !isCatalog ? item.name : this.connectionSelectorService.currentObjectSchemaId;

        const title = NodeManagerUtils.concatSchemaAndCatalog(
          catalogName,
          schemaName
        );

        const handler = isCatalog
          ? () => this.connectionSelectorService.selectCatalog(catalogName!)
          : () => this.connectionSelectorService.selectSchema(schemaName!);

        let icon = 'database';

        if (catalogName && schemaName) {
          icon = 'schema_system';
        }

        const menuItem: IMenuItem = {
          id: title,
          title,
          icon,
          onClick: handler,
        };
        return menuItem;
      });

    return list;
  }
}
