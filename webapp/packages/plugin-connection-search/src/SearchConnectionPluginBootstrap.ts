/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_CONNECTIONS, MENU_TREE_CREATE_CONNECTION } from '@cloudbeaver/plugin-connections';

import { ACTION_CONNECTION_SEARCH } from './Actions/ACTION_CONNECTION_SEARCH.js';
import { ConnectionSearchSettingsService } from './ConnectionSearchSettingsService.js';
import { ConnectionSearchService } from './Search/ConnectionSearchService.js';

export class SearchConnectionPluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly connectionSearchService: ConnectionSearchService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionSearchSettingsService: ConnectionSearchSettingsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [MENU_CONNECTIONS, MENU_TREE_CREATE_CONNECTION],
      getItems: (context, items) => [...items, ACTION_CONNECTION_SEARCH],
      orderItems: (context, items) => {
        items.push(...menuExtractItems(items, [ACTION_CONNECTION_SEARCH]));
        return items;
      },
    });

    this.actionService.addHandler({
      id: 'connection-search',
      actions: [ACTION_CONNECTION_SEARCH],
      isHidden: (context, action) => {
        if (this.connectionsManagerService.createConnectionProjects.length === 0 || !this.permissionsService.has(EAdminPermission.admin)) {
          return true;
        }

        if (action === ACTION_CONNECTION_SEARCH) {
          return this.connectionSearchSettingsService.disabled;
        }

        return false;
      },
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      handler: (context, action) => {
        switch (action) {
          case ACTION_CONNECTION_SEARCH: {
            this.connectionSearchService.open();
            break;
          }
        }
      },
    });
  }
}

export type SearchConnectionPluginBootstrap = SearchConnectionPluginBootstrapImpl;

export class SearchConnectionPluginBootstrapDI extends Context.Service<SearchConnectionPluginBootstrapDI, SearchConnectionPluginBootstrapImpl>()(
  '@cloudbeaver/plugin-connection-search/SearchConnectionPluginBootstrap#SearchConnectionPluginBootstrap',
) {
  static readonly implementation = SearchConnectionPluginBootstrapImpl;

  static readonly dependencies = () =>
    [
      PermissionsService,
      ProjectInfoResource,
      ConnectionSearchService,
      ConnectionsManagerService,
      MenuService,
      ActionService,
      ConnectionSearchSettingsService,
    ] as const;
  static readonly make: Effect.Effect<
    SearchConnectionPluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof PermissionsService>
    | Context.Service.Identifier<typeof ProjectInfoResource>
    | Context.Service.Identifier<typeof ConnectionSearchService>
    | Context.Service.Identifier<typeof ConnectionsManagerService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof ConnectionSearchSettingsService>
  > = Effect.gen(function* makeSearchConnectionPluginBootstrap() {
    const permissionsService = yield* PermissionsService;
    const projectInfoResource = yield* ProjectInfoResource;
    const connectionSearchService = yield* ConnectionSearchService;
    const connectionsManagerService = yield* ConnectionsManagerService;
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const connectionSearchSettingsService = yield* ConnectionSearchSettingsService;

    return new SearchConnectionPluginBootstrapImpl(
      permissionsService,
      projectInfoResource,
      connectionSearchService,
      connectionsManagerService,
      menuService,
      actionService,
      connectionSearchSettingsService,
    );
  });
  static readonly layer: Layer.Layer<
    SearchConnectionPluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof PermissionsService>
    | Context.Service.Identifier<typeof ProjectInfoResource>
    | Context.Service.Identifier<typeof ConnectionSearchService>
    | Context.Service.Identifier<typeof ConnectionsManagerService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof ConnectionSearchSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SearchConnectionPluginBootstrap = SearchConnectionPluginBootstrapDI;
