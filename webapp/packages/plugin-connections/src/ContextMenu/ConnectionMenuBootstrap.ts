/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  ConnectionsManagerService,
  ConnectionsSettingsService,
  createConnectionParam,
  DATA_CONTEXT_CONNECTION,
  DBDriverResource,
  EConnectionFeature,
  isConnectionNode,
} from '@cloudbeaver/core-connections';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  DATA_CONTEXT_NAV_NODE,
  ENodeFeature,
  EObjectFeature,
  isConnectionFolder,
  type NavNode,
  NavTreeResource,
  NodeManagerUtils,
} from '@cloudbeaver/core-navigation-tree';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { getUniqueName } from '@cloudbeaver/core-utils';
import { ACTION_DELETE, ActionService, menuExtractItems, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_NAVIGATION_TREE_MANAGE, nodeDeletionPlanContext, NodeDeletionService } from '@cloudbeaver/plugin-navigation-tree';
import { PublicConnectionFormService } from '../PublicConnectionForm/PublicConnectionFormService.js';
import { ACTION_CONNECTION_CHANGE_CREDENTIALS } from './Actions/ACTION_CONNECTION_CHANGE_CREDENTIALS.js';
import { ACTION_CONNECTION_CHANGE_DB_PASSWORD } from './Actions/ACTION_CONNECTION_CHANGE_DB_PASSWORD.js';
import { ACTION_CONNECTION_CLONE } from './Actions/ACTION_CONNECTION_CLONE.js';
import { ACTION_CONNECTION_DISCONNECT } from './Actions/ACTION_CONNECTION_DISCONNECT.js';
import { ACTION_CONNECTION_DISCONNECT_ALL } from './Actions/ACTION_CONNECTION_DISCONNECT_ALL.js';
import { ACTION_CONNECTION_EDIT } from './Actions/ACTION_CONNECTION_EDIT.js';
import { ChangeDatabasePasswordDialog } from './ChangeDatabasePasswordDialog/ChangeDatabasePasswordDialog.js';
import { MENU_CONNECTIONS } from './MENU_CONNECTIONS.js';
import { MENU_CONNECTION_SECURITY } from './MENU_CONNECTION_SECURITY.js';

export class ConnectionMenuBootstrapImpl extends Bootstrap {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionInfoAuthPropertiesResource: ConnectionInfoAuthPropertiesResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly publicConnectionFormService: PublicConnectionFormService,
    private readonly connectionsSettingsService: ConnectionsSettingsService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly localizationService: LocalizationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly nodeDeletionService: NodeDeletionService,
    private readonly navTreeResource: NavTreeResource,
  ) {
    super();
  }

  override register(): void {
    this.actionService.addHandler({
      id: 'connection-delete',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      actions: [ACTION_DELETE],
      contexts: [DATA_CONTEXT_NAV_NODE],
      isActionApplicable: context => isConnectionNode(context.get(DATA_CONTEXT_NAV_NODE)!),
      isHidden: context => !this.canDeleteConnection(context.get(DATA_CONTEXT_NAV_NODE)!),
      isDisabled: context => this.nodeDeletionService.isDeleting || !this.canDeleteConnection(context.get(DATA_CONTEXT_NAV_NODE)!),
      handler: context => this.nodeDeletionService.deleteSelection(context),
    });

    this.actionService.addHandler({
      id: 'database-object-delete',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      actions: [ACTION_DELETE],
      contexts: [DATA_CONTEXT_NAV_NODE],
      isActionApplicable: context => this.isDatabaseNode(context.get(DATA_CONTEXT_NAV_NODE)!),
      isHidden: context => !this.canDeleteObject(context.get(DATA_CONTEXT_NAV_NODE)!),
      isDisabled: context => this.nodeDeletionService.isDeleting || !this.canDeleteObject(context.get(DATA_CONTEXT_NAV_NODE)!),
      handler: context => this.nodeDeletionService.deleteSelection(context),
    });

    this.nodeDeletionService.prepareDeletion.addHandler(async (nodes, contexts) => {
      const plan = contexts.getContext(nodeDeletionPlanContext);

      for (const node of nodes.filter(isConnectionNode)) {
        const key = node.projectId && node.objectId ? createConnectionParam(node.projectId, node.objectId) : undefined;
        const connection = key ? await this.connectionInfoResource.load(key).catch(() => undefined) : undefined;
        const target = {
          node,
          type: 'plugin_connections_delete_connection',
          readOnly: connection?.features.includes(EConnectionFeature.readOnly),
          keepChildren: true,
        };

        // Readonly restricts database edits, not removal of the saved connection configuration.
        if (!key || !connection?.canDelete) {
          plan.exclude({ ...target, owner: 'connections', reason: 'plugin_navigation_tree_delete_unavailable' });
          continue;
        }

        plan.addOperation({
          id: `delete-connection:${node.uri}`,
          owner: 'connections',
          targets: [target],
          execute: async () => {
            const deleted = await this.connectionsManagerService.deleteConnection(key);
            return [{ targetId: node.uri, status: deleted ? 'deleted' : 'cancelled' }];
          },
        });
      }

      for (const node of nodes.filter(node => this.isDatabaseNode(node))) {
        const key = node.projectId ? this.connectionInfoResource.getConnectionIdForNodeId(node.projectId, node.uri) : undefined;
        const connection = key ? await this.connectionInfoResource.load(key).catch(() => undefined) : undefined;
        const readOnly = connection?.features.includes(EConnectionFeature.readOnly);
        const target = { node, type: 'plugin_connections_delete_database_object', readOnly };

        if ((key && !connection) || !this.canDeleteObject(node)) {
          plan.exclude({
            ...target,
            owner: 'database-objects',
            reason: readOnly ? 'plugin_connections_delete_read_only' : 'plugin_navigation_tree_delete_unavailable',
          });

          continue;
        }

        plan.addOperation({
          id: `delete-database-object:${node.uri}`,
          owner: 'database-objects',
          targets: [target],
          execute: async () => {
            await this.navTreeResource.deleteNode(node.uri);
            return [{ targetId: node.uri, status: 'deleted' }];
          },
        });
      }
    });

    this.addConnectionsMenuToTopAppBar();

    this.menuService.addCreator({
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      getItems: (context, items) => [...items, ACTION_CONNECTION_EDIT, ACTION_CONNECTION_CLONE],
    });

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      isApplicable: context => context.get(DATA_CONTEXT_NAV_NODE)!.objectFeatures.includes(EObjectFeature.dataSource),
      getItems: (context, items) => [...items, MENU_CONNECTION_SECURITY],
    });

    this.menuService.addCreator({
      menus: [MENU_CONNECTION_SECURITY],
      getItems: (context, items) => [...items, ACTION_CONNECTION_CHANGE_DB_PASSWORD],
    });

    this.menuService.setHandler({
      id: 'connection-security',
      menus: [MENU_CONNECTION_SECURITY],
      getLoader: context => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;

        return [
          getCachedMapResourceLoaderState(this.connectionInfoResource, () => connectionKey),
          getCachedMapResourceLoaderState(this.dbDriverResource, () => this.connectionInfoResource.get(connectionKey)?.driverId ?? null),
        ];
      },
      isHidden: context => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = this.connectionInfoResource.get(connectionKey);

        if (!connection) {
          return true;
        }

        const driver = this.dbDriverResource.get(connection.driverId);

        return !!driver?.anonymousAccess || !this.serverConfigResource.dbUserPasswordChangeEnabled || !connection.canEdit || !connection.connected;
      },
    });

    this.actionService.addHandler({
      id: 'connection-change-db-password',
      menus: [MENU_CONNECTION_SECURITY],
      actions: [ACTION_CONNECTION_CHANGE_DB_PASSWORD],
      contexts: [DATA_CONTEXT_CONNECTION],
      handler: async context => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;

        await this.commonDialogService.open(ChangeDatabasePasswordDialog, {
          projectId: connectionKey.projectId,
          connectionId: connectionKey.connectionId,
        });
      },
    });

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION],
      getItems: (context, items) => [...items, ACTION_CONNECTION_CHANGE_CREDENTIALS, ACTION_CONNECTION_DISCONNECT, ACTION_CONNECTION_DISCONNECT_ALL],
      orderItems(context, items) {
        const disconnect = menuExtractItems(items, [ACTION_CONNECTION_DISCONNECT, ACTION_CONNECTION_DISCONNECT_ALL]);

        if (disconnect.length > 0) {
          return [...items, new MenuSeparatorItem(), ...disconnect];
        }

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'connection-menu-management',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      actions: [ACTION_CONNECTION_EDIT, ACTION_CONNECTION_CLONE],
      isActionApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        return node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      contexts: [DATA_CONTEXT_CONNECTION],
      isHidden: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = this.connectionInfoResource.get(connectionKey);

        if (!connection) {
          return true;
        }

        if (action === ACTION_CONNECTION_EDIT) {
          return !(connection.canEdit || connection.canViewSettings);
        }

        if (action === ACTION_CONNECTION_CLONE) {
          return !connection.canEdit;
        }

        return true;
      },
      handler: async (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = await this.connectionInfoResource.load(connectionKey);

        switch (action) {
          case ACTION_CONNECTION_EDIT: {
            this.publicConnectionFormService.open(connection.projectId, { connectionId: connection.id });
            break;
          }
          case ACTION_CONNECTION_CLONE: {
            try {
              // Load all connections for the project first to ensure we have them all to generate a unique name for the cloned connection
              const projectConnections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(connection.projectId));
              const connectionNames = projectConnections.map(connection => connection.name);
              const uniqueName = getUniqueName(
                connection.name.concat(` ${this.localizationService.translate('ui_copy').toLowerCase()}`),
                connectionNames,
              );

              if (!connection.nodePath) {
                this.notificationService.logException(new Error('Connection node path is undefined'), 'plugin_connections_connection_clone_error');
                return;
              }

              await this.connectionInfoResource.createFromNode(connection.projectId, connection.nodePath, uniqueName);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_connections_connection_clone_error');
            }

            break;
          }
        }
      },
    });

    this.actionService.addHandler({
      id: 'connection-management',
      actions: [ACTION_CONNECTION_CHANGE_CREDENTIALS, ACTION_CONNECTION_DISCONNECT, ACTION_CONNECTION_DISCONNECT_ALL],
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      isActionApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        return node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      isHidden: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = this.connectionInfoResource.get(connectionKey);

        if (!connection) {
          return true;
        }

        if (action === ACTION_CONNECTION_DISCONNECT) {
          return !connection.connected;
        }

        if (action === ACTION_CONNECTION_DISCONNECT_ALL) {
          return !this.connectionsManagerService.hasAnyConnection(true);
        }

        if (action === ACTION_CONNECTION_CHANGE_CREDENTIALS) {
          const auth = this.connectionInfoAuthPropertiesResource.get(connectionKey);
          const driver = this.dbDriverResource.get(connection.driverId);

          return !!driver?.anonymousAccess || !this.serverConfigResource.distributed || !!auth?.sharedCredentials;
        }

        return true;
      },
      getLoader: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const loaders = [getCachedMapResourceLoaderState(this.connectionInfoResource, () => connectionKey, undefined, true)];

        if (action === ACTION_CONNECTION_CHANGE_CREDENTIALS) {
          loaders.push(
            getCachedMapResourceLoaderState(this.dbDriverResource, () => this.connectionInfoResource.get(connectionKey)?.driverId ?? null),
          );
        }

        if (action === ACTION_CONNECTION_CHANGE_CREDENTIALS) {
          loaders.push(getCachedMapResourceLoaderState(this.connectionInfoAuthPropertiesResource, () => connectionKey, undefined, true));
        }

        return loaders;
      },
      handler: async (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = await this.connectionInfoResource.load(connectionKey);

        switch (action) {
          case ACTION_CONNECTION_DISCONNECT: {
            await this.connectionsManagerService.closeConnectionAsync(createConnectionParam(connection));
            break;
          }
          case ACTION_CONNECTION_DISCONNECT_ALL: {
            await this.connectionsManagerService.closeAllConnections();
            break;
          }

          case ACTION_CONNECTION_CHANGE_CREDENTIALS: {
            await this.connectionsManagerService.requireConnection({ connectionId: connection.id, projectId: connection.projectId }, true);
            break;
          }
        }
      },
    });
  }

  private isDatabaseNode(node: NavNode): boolean {
    return !isConnectionNode(node) && !isConnectionFolder(node) && NodeManagerUtils.isDatabaseObject(node.uri);
  }

  private canDeleteConnection(node: NavNode): boolean {
    const connection =
      node.projectId && node.objectId ? this.connectionInfoResource.get(createConnectionParam(node.projectId, node.objectId)) : undefined;

    return !!connection?.canDelete;
  }

  private canDeleteObject(node: NavNode): boolean {
    const connection = this.connectionInfoResource.getConnectionForNode(node.uri);

    return (
      !!node.features?.includes(ENodeFeature.canDelete) &&
      !connection?.features.includes(EConnectionFeature.readOnly) &&
      !connection?.features.includes(EConnectionFeature.restrictMetadataEdit)
    );
  }

  private addConnectionsMenuToTopAppBar() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, MENU_CONNECTIONS],
    });

    this.menuService.setHandler({
      id: 'connections-menu-base',
      menus: [MENU_CONNECTIONS],
      isHidden: () => this.connectionsManagerService.createConnectionProjects.length === 0 || this.connectionsSettingsService.disabled,
      isLabelVisible: () => false,
    });
  }
}

export type ConnectionMenuBootstrap = ConnectionMenuBootstrapImpl;

export class ConnectionMenuBootstrapDI extends Context.Service<ConnectionMenuBootstrapDI, ConnectionMenuBootstrapImpl>()(
  '@cloudbeaver/plugin-connections/ContextMenu/ConnectionMenuBootstrap#ConnectionMenuBootstrap',
) {
  static readonly implementation = ConnectionMenuBootstrapImpl;

  static readonly dependencies = () =>
    [
      NotificationService,
      ConnectionInfoResource,
      DBDriverResource,
      ConnectionInfoAuthPropertiesResource,
      ConnectionsManagerService,
      ActionService,
      MenuService,
      PublicConnectionFormService,
      ConnectionsSettingsService,
      ServerConfigResource,
      LocalizationService,
      CommonDialogService,
      NodeDeletionService,
      NavTreeResource,
    ] as const;
  static readonly make: Effect.Effect<
    ConnectionMenuBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof ConnectionInfoAuthPropertiesResource>
    | Context.Service.Identifier<typeof ConnectionsManagerService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof PublicConnectionFormService>
    | Context.Service.Identifier<typeof ConnectionsSettingsService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NodeDeletionService>
    | Context.Service.Identifier<typeof NavTreeResource>
  > = Effect.gen(function* makeConnectionMenuBootstrap() {
    const notificationService = yield* NotificationService;
    const connectionInfoResource = yield* ConnectionInfoResource;
    const dbDriverResource = yield* DBDriverResource;
    const connectionInfoAuthPropertiesResource = yield* ConnectionInfoAuthPropertiesResource;
    const connectionsManagerService = yield* ConnectionsManagerService;
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;
    const publicConnectionFormService = yield* PublicConnectionFormService;
    const connectionsSettingsService = yield* ConnectionsSettingsService;
    const serverConfigResource = yield* ServerConfigResource;
    const localizationService = yield* LocalizationService;
    const commonDialogService = yield* CommonDialogService;
    const nodeDeletionService = yield* NodeDeletionService;
    const navTreeResource = yield* NavTreeResource;

    return new ConnectionMenuBootstrapImpl(
      notificationService,
      connectionInfoResource,
      dbDriverResource,
      connectionInfoAuthPropertiesResource,
      connectionsManagerService,
      actionService,
      menuService,
      publicConnectionFormService,
      connectionsSettingsService,
      serverConfigResource,
      localizationService,
      commonDialogService,
      nodeDeletionService,
      navTreeResource,
    );
  });
  static readonly layer: Layer.Layer<
    ConnectionMenuBootstrapDI,
    never,
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof ConnectionInfoAuthPropertiesResource>
    | Context.Service.Identifier<typeof ConnectionsManagerService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof PublicConnectionFormService>
    | Context.Service.Identifier<typeof ConnectionsSettingsService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NodeDeletionService>
    | Context.Service.Identifier<typeof NavTreeResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionMenuBootstrap = ConnectionMenuBootstrapDI;
