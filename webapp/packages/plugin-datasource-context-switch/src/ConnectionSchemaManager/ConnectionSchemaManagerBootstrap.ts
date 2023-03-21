/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { compareConnectionsInfo, ConnectionInfoResource, ConnectionsManagerService, ConnectionsSettingsService, ContainerResource, createConnectionParam, serializeConnectionParam } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { EObjectFeature, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { DATA_CONTEXT_LOADABLE_STATE, DATA_CONTEXT_MENU, MenuBaseItem, menuExtractItems, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ConnectionSchemaManagerService } from './ConnectionSchemaManagerService';
import { ConnectionIcon } from './ConnectionSelector/ConnectionIcon';
import type { IConnectionSelectorExtraProps } from './ConnectionSelector/IConnectionSelectorExtraProps';
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
    private readonly optionsPanelService: OptionsPanelService,
    private readonly appAuthService: AppAuthService,
    private readonly containerResource: ContainerResource,
    private readonly menuService: MenuService,
    private readonly connectionsSettingsService: ConnectionsSettingsService,
  ) {
    super();
  }

  register(): void {
    this.addTopAppMenuItems();

    this.connectionInfoResource.onDataUpdate
      .addHandler(this.connectionSchemaManagerService.onConnectionUpdate.bind(this.connectionSchemaManagerService));

    this.menuService.setHandler<IConnectionSelectorExtraProps>({
      id: 'connection-selector-base',
      isApplicable: context => context.hasValue(DATA_CONTEXT_MENU, MENU_CONNECTION_SELECTOR),
      isLoading: () => this.connectionSelectorLoading,
      isHidden: () => this.isHidden() || !this.appAuthService.authenticated,
      isDisabled: () => (
        !this.connectionSchemaManagerService.isConnectionChangeable
        || this.connectionSelectorLoading
        || !this.connectionsManagerService.hasAnyConnection()
        || this.connectionSchemaManagerService.isChangingConnectionContainer
      ),
      getInfo: (context, menu) => {
        const connection = this.connectionSchemaManagerService.currentConnection;
        const label = connection?.name || 'plugin_datasource_context_switch_select_connection';

        return {
          ...menu,
          label,
        };
      },
      iconComponent: () => ConnectionIcon,
      getExtraProps: () => ({ connectionKey: this.connectionSchemaManagerService.currentConnectionKey, small: true }),
      getLoader: (context, menu) => {
        if (this.isHidden()) {
          return [];
        }

        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);

        return state.getState(
          menu.id,
          () => {
            if (!this.connectionSchemaManagerService.activeConnectionKey) {
              return this.appAuthService.loaders;
            }
            return [
              ...this.appAuthService.loaders,
              getCachedMapResourceLoaderState(this.containerResource, {
                ...this.connectionSchemaManagerService.activeConnectionKey,
                catalogId: this.connectionSchemaManagerService.activeObjectCatalogId,
              }, undefined),
            ];
          }
        );
      },
    });

    this.menuService.addCreator({
      menus: [MENU_CONNECTION_SELECTOR],
      isApplicable: () => this.connectionsManagerService.hasAnyConnection(),
      getItems: (context, items) => {
        items = [...items];

        const connections = this.connectionsManagerService.projectConnections
          .filter(connection => {
            if (
              !this.connectionSchemaManagerService.isProjectChangeable
              && this.connectionSchemaManagerService.activeProjectId
              && connection.projectId !== this.connectionSchemaManagerService.activeProjectId
            ) {
              return false;
            }

            return !connection.template;
          })
          .sort((a, b) => {
            if (a.connected === b.connected) {
              return compareConnectionsInfo(a, b);
            }

            return Number(b.connected) - Number(a.connected);
          });


        for (const connection of connections) {
          const connectionKey = createConnectionParam(connection);

          items.push(new MenuBaseItem<IConnectionSelectorExtraProps>(
            {
              id: serializeConnectionParam(connectionKey),
              label: connection.name,
              tooltip: connection.description,
            },
            {
              onSelect: () => {
                this.connectionSchemaManagerService.selectConnection(connectionKey);
              },
            },
            {
              iconComponent: () => ConnectionIcon,
              isDisabled: () => (
                this.connectionSchemaManagerService.currentConnectionKey !== null
                && this.connectionSchemaManagerService.currentConnectionKey !== undefined
                && this.connectionInfoResource.isKeyEqual(
                  this.connectionSchemaManagerService.currentConnectionKey,
                  connectionKey
                )
              ),
              getExtraProps: () => ({ connectionKey }),
            }
          ));
        }

        return items;
      },
    });

    this.menuService.setHandler({
      id: 'connection-data-container-selector-base',
      isApplicable: context => context.hasValue(DATA_CONTEXT_MENU, MENU_CONNECTION_DATA_CONTAINER_SELECTOR),
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
        this.isHidden()
        || !this.appAuthService.authenticated
        || !this.connectionSchemaManagerService.objectContainerList
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
      getLoader: (context, menu) => {
        if (this.isHidden()) {
          return [];
        }

        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);

        return state.getState(
          menu.id,
          () => this.appAuthService.loaders
        );
      },
      getInfo: (context, menu) => {
        const connectionSchemaManagerService = this.connectionSchemaManagerService;

        let icon: string | undefined = '/icons/plugin_datasource_context_switch_database_m.svg';

        let label = NodeManagerUtils.concatSchemaAndCatalog(
          connectionSchemaManagerService.currentObjectCatalogId,
          connectionSchemaManagerService.currentObjectSchemaId
        );

        if (!label) {
          label = 'plugin_datasource_context_switch_select_container';
        }

        if (
          !connectionSchemaManagerService.currentObjectSchema
          && !connectionSchemaManagerService.currentObjectCatalog
        ) {
          icon = undefined;
        } else if (
          connectionSchemaManagerService.currentObjectSchema?.object?.features?.includes(EObjectFeature.schema)
        ) {
          // TODO move such kind of icon paths to a set of constants
          icon = '/icons/plugin_datasource_context_switch_schema_m.svg';
        } else if (
          connectionSchemaManagerService.currentObjectCatalog?.object?.features?.includes(EObjectFeature.catalog)
        ) {
          icon = '/icons/plugin_datasource_context_switch_database_m.svg';
        }


        return {
          ...menu,
          icon,
          label,
        };
      },
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
              icon: '/icons/plugin_datasource_context_switch_schema_sm.svg',
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
                icon: '/icons/plugin_datasource_context_switch_database_sm.svg',
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
                icon: '/icons/plugin_datasource_context_switch_schema_sm.svg',
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

  load(): void { }

  private isHidden(): boolean {
    return (
      this.connectionsSettingsService.settings.getValue('disabled')
      || this.optionsPanelService.active
      || (
        !this.connectionSchemaManagerService.isConnectionChangeable
        && !this.connectionSchemaManagerService.currentConnectionKey
      )
    );
  }

  private addTopAppMenuItems() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [
        ...items,
        MENU_CONNECTION_SELECTOR,
        MENU_CONNECTION_DATA_CONTAINER_SELECTOR,
      ],
      orderItems: (context, items) => {
        const extracted = menuExtractItems(items, [MENU_CONNECTION_SELECTOR, MENU_CONNECTION_DATA_CONTAINER_SELECTOR]);

        return [...items, ...extracted];
      },
    });
  }
}
