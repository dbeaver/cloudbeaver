/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { ISchema } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { ComputedMenuItemModel, ComputedMenuPanelModel, IMenuItem } from '@dbeaver/core/dialogs';

import { ConnectionSchemaManagerService } from '../ConnectionSchemaManagerService';

@injectable()
export class ConnectionSelectorController {

  connectionMenu: IMenuItem;
  schemaOrCatalogMenu: IMenuItem;

  get isSelectorVisible() {
    return this.connectionSelectorService.isSelectorVisible;
  }
  get isSchemaSelectorVisible() {
    return this.connectionSelectorService.isSelectorVisible && Boolean(this.currentSchemaTitle);
  }

  @computed get schemaSelectionDisabled(): boolean {
    return !this.connectionSelectorService.isTabStateChangeable
      || this.getSchemaOrCatalogItems().length === 0;
  }

  @computed private get currentSchemaTitle(): string {
    const currentTabState = this.connectionSelectorService.currentTabState;
    if (!currentTabState) {
      return '';
    }
    if (currentTabState.schemaId && currentTabState.catalogId) {
      return `${currentTabState.schemaId}@${currentTabState.catalogId}`;
    }
    return currentTabState.schemaId || currentTabState.catalogId || '';
  }

  @computed private get currentSchemaIcon(): string {
    const currentTabState = this.connectionSelectorService.currentTabState;
    if (currentTabState && currentTabState.schemaId) {
      // TODO move such kind of icon paths to a set of constants
      return 'schema_system';
    }
    if (currentTabState && currentTabState.catalogId) {
      return 'database';
    }
    return '';
  }

  constructor(private connectionSelectorService: ConnectionSchemaManagerService) {

    this.connectionMenu = new ComputedMenuItemModel({
      id: 'connectionsDropdown',
      isDisabled: () => this.connectionSelectorService.connectionSelectionDisabled,
      titleGetter: () => this.connectionSelectorService?.currentConnection?.name,
      iconGetter: () => this.connectionSelectorService?.currentConnection?.icon,
      panel: new ComputedMenuPanelModel({
        id: 'connectionsDropdownPanel',
        menuItemsGetter: () => this.getConnectionItems(),
      }),
    });

    this.schemaOrCatalogMenu = new ComputedMenuItemModel({
      id: 'connectionsDropdown',
      isDisabled: () => this.schemaSelectionDisabled,
      titleGetter: () => this.currentSchemaTitle,
      iconGetter: () => this.currentSchemaIcon,
      panel: new ComputedMenuPanelModel({
        id: 'connectionsDropdownPanel',
        menuItemsGetter: () => this.getSchemaOrCatalogItems(),
      }),
    });
  }

  private getConnectionItems(): IMenuItem[] {
    return this.connectionSelectorService.connectionsList.map((item) => {
      const menuItem: IMenuItem = {
        id: item.id,
        title: item.name || item.id,
        onClick: () => this.connectionSelectorService.onSelectConnection(item),
      };
      return menuItem;
    });
  }

  private getSchemaOrCatalogItems(): IMenuItem[] {
    return this.connectionSelectorService.schemaList.length
      ? this.listToMenuItems(this.connectionSelectorService.schemaList, true)
      : this.listToMenuItems(this.connectionSelectorService.catalogsList, false);
  }

  private listToMenuItems(list: ISchema[], isSchema: boolean): IMenuItem[] {
    return list.map((item) => {
      const menuItem: IMenuItem = {
        id: item.id,
        title: item.id,
        onClick: () => {
          if (isSchema) {
            this.connectionSelectorService.onSelectSchema(item.id);
          } else {
            this.connectionSelectorService.onSelectCatalog(item.id);
          }
        },
      };
      return menuItem;
    });
  }
}
