/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { compareConnectionsInfo, ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';

import { NodeManagerUtils } from '../../shared/NodesManager/NodeManagerUtils';
import { ConnectionSchemaManagerService } from './ConnectionSchemaManagerService';
import { ConnectionIcon } from './ConnectionSelector/ConnectionIcon';
import { MENU_CONNECTION_DATA_CONTAINER_SELECTOR } from './MENU_CONNECTION_DATA_CONTAINER_SELECTOR';
import { MENU_CONNECTION_SELECTOR } from './MENU_CONNECTION_SELECTOR';


@injectable()
export class ConnectionSchemaManagerBootstrap extends Bootstrap {
  get connectionSelectorLoading(): boolean {
    return (
      this.connectionSchemaManagerService.isChangingConnection
      || this.connectionsManagerService.containerContainers.isLoading()
    );
  }

  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly menuService: MenuService
  ) {
    super();
  }

  register(): void {

    this.connectionInfoResource.onDataUpdate
      .addHandler(this.connectionSchemaManagerService.onConnectionUpdate.bind(this.connectionSchemaManagerService));

    this.menuService.setHandler({
      id: 'connection-selector-base',
      isApplicable: context => context.find(DATA_CONTEXT_MENU, MENU_CONNECTION_SELECTOR),
      isLoading: () => this.connectionSelectorLoading,
      isDisabled: () => (
        !this.connectionSchemaManagerService.isConnectionChangeable
        || this.connectionSelectorLoading
        || !this.connectionsManagerService.hasAnyConnection()
        || this.connectionSchemaManagerService.isChangingConnectionContainer
      ),
    });

    this.menuService.addCreator({
      menus: [MENU_CONNECTION_SELECTOR],
      isApplicable: () => this.connectionsManagerService.hasAnyConnection(),
      getItems: (context, items) => {
        items = [...items];

        const connections = this.connectionInfoResource.values
          .slice()
          .sort((a, b) => {
            if (a.connected === b.connected) {
              return compareConnectionsInfo(a, b);
            }

            return Number(b.connected) - Number(a.connected);
          });


        for (const connection of connections) {
          items.push(new MenuBaseItem(
            {
              id: connection.id,
              label: connection.name,
              tooltip: connection.description,
            },
            {
              onSelect: () => {
                this.connectionSchemaManagerService.selectConnection(connection.id);
              },
            },
            {
              iconComponent: () => ConnectionIcon,
              isDisabled: () => this.connectionSchemaManagerService.currentConnectionId === connection.id,
            }
          ));
        }

        return items;
      },
    });

    this.menuService.setHandler({
      id: 'connection-data-container-selector-base',
      isApplicable: context => context.find(DATA_CONTEXT_MENU, MENU_CONNECTION_DATA_CONTAINER_SELECTOR),
      isDisabled: () => (
        !this.connectionSchemaManagerService.currentConnection?.connected
        || this.connectionSelectorLoading
        || this.connectionSchemaManagerService.isChangingConnectionContainer
        || (
          !this.connectionSchemaManagerService.isObjectCatalogChangeable
          && !this.connectionSchemaManagerService.isObjectSchemaChangeable
        )
      ),
      isLoading: () => (
        !this.connectionSelectorLoading
        && this.connectionSchemaManagerService.isChangingConnectionContainer
      ),
      isHidden: () => (
        !this.connectionSchemaManagerService.objectContainerList
        || (
          this.connectionSchemaManagerService.currentObjectSchemaId === undefined
          && this.connectionSchemaManagerService.currentObjectCatalogId === undefined
          && !this.connectionSchemaManagerService.isObjectCatalogChangeable
          && !this.connectionSchemaManagerService.isObjectSchemaChangeable
        )
        || (
          this.connectionSchemaManagerService.objectContainerList.schemaList.length === 0
          && this.connectionSchemaManagerService.objectContainerList.catalogList.length === 0
        )
      ),
    });

    this.menuService.addCreator({
      menus: [MENU_CONNECTION_DATA_CONTAINER_SELECTOR],
      getItems: (context, items) => {
        items = [...items];

        if (!this.connectionSchemaManagerService.objectContainerList) {
          return [];
        }

        const schemaList = this.connectionSchemaManagerService.objectContainerList.schemaList
          .slice()
          .sort((a, b) => {
            if (a.name === b.name) {
              return 0;
            }

            if (a.name === this.connectionSchemaManagerService.currentObjectSchemaId) {
              return -1;
            }

            if (b.name === this.connectionSchemaManagerService.currentObjectSchemaId) {
              return 1;
            }

            return 0;
          });

        const catalogList = this.connectionSchemaManagerService.objectContainerList.catalogList
          .slice()
          .sort((a, b) => {
            if (a.catalog.name === b.catalog.name) {
              return 0;
            }

            if (a.catalog.name === this.connectionSchemaManagerService.currentObjectCatalogId) {
              return -1;
            }

            if (b.catalog.name === this.connectionSchemaManagerService.currentObjectCatalogId) {
              return 1;
            }

            return 0;
          });

        let previousSelected: boolean | null = null;

        for (const schema of schemaList) {
          if (!schema.name) {
            continue;
          }

          const title = schema.name;
          const selected = this.connectionSchemaManagerService.currentObjectSchemaId === title;

          if (previousSelected && !selected) {
            items.push(new MenuSeparatorItem());
          }

          previousSelected = selected;

          items.push(new MenuBaseItem(
            {
              id: title,
              label: title,
              tooltip: title,
              icon: 'schema_system',
            },
            {
              onSelect: async () => {
                await this.connectionSchemaManagerService.selectSchema(title);
              },
            },
            {
              isDisabled: () => this.connectionSchemaManagerService.currentObjectSchemaId === title,
            }
          ));
        }

        for (const catalogData of catalogList) {
          const catalog = catalogData.catalog;
          if (!catalog.name) {
            continue;
          }

          const selected = this.connectionSchemaManagerService.currentObjectCatalogId === catalog.name;

          if (previousSelected && !selected) {
            items.push(new MenuSeparatorItem());
          }

          previousSelected = selected;

          if (catalogData.schemaList.length === 0) {
            items.push(new MenuBaseItem(
              {
                id: catalog.name,
                label: catalog.name,
                tooltip: catalog.name,
                icon: 'database',
              },
              {
                onSelect: async () => {
                  await this.connectionSchemaManagerService.selectCatalog(catalog.name!);
                },
              },
              {
                isDisabled: () => this.connectionSchemaManagerService.currentObjectCatalogId === catalog.name,
              }
            ));
          }

          for (const schema of catalogData.schemaList) {
            if (!schema.name) {
              continue;
            }

            const title = NodeManagerUtils.concatSchemaAndCatalog(
              catalog.name,
              schema.name
            );

            items.push(new MenuBaseItem(
              {
                id: title,
                label: title,
                tooltip: title,
                icon: 'schema_system',
              },
              {
                onSelect: async () => {
                  await this.connectionSchemaManagerService.selectSchema(schema.name!, catalog.name!);
                },
              },
              {
                isDisabled: () => (
                  this.connectionSchemaManagerService.currentObjectSchemaId === schema.name
                  && this.connectionSchemaManagerService.currentObjectCatalogId === catalog.name
                ),
              }
            ));
          }
        }

        return items;
      },
    });
  }

  load(): void {}
}
