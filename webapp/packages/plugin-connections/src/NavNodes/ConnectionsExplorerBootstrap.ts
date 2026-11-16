/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS } from '@cloudbeaver/plugin-navigation-tree';
import { MENU_TREE_CREATE_CONNECTION } from '../Actions/MENU_TREE_CREATE_CONNECTION.js';

export class ConnectionsExplorerBootstrapImpl extends Bootstrap {
  constructor(private readonly menuService: MenuService) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [MENU_ELEMENTS_TREE_TOOLS],
      isApplicable: context => {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;

        return tree.baseRoot === ROOT_NODE_PATH;
      },
      getItems: (context, items) => {
        if (!items.includes(MENU_TREE_CREATE_CONNECTION)) {
          return [...items, MENU_TREE_CREATE_CONNECTION];
        }

        return items;
      },
    });
  }
}

export type ConnectionsExplorerBootstrap = ConnectionsExplorerBootstrapImpl;

export class ConnectionsExplorerBootstrapDI extends Context.Service<ConnectionsExplorerBootstrapDI, ConnectionsExplorerBootstrapImpl>()(
  '@cloudbeaver/plugin-connections/NavNodes/ConnectionsExplorerBootstrap#ConnectionsExplorerBootstrap',
) {
  static readonly implementation = ConnectionsExplorerBootstrapImpl;

  static readonly dependencies = () => [MenuService] as const;
  static readonly make: Effect.Effect<ConnectionsExplorerBootstrapImpl, never, Context.Service.Identifier<typeof MenuService>> = Effect.gen(
    function* makeConnectionsExplorerBootstrap() {
      const menuService = yield* MenuService;

      return new ConnectionsExplorerBootstrapImpl(menuService);
    },
  );
  static readonly layer: Layer.Layer<ConnectionsExplorerBootstrapDI, never, Context.Service.Identifier<typeof MenuService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionsExplorerBootstrap = ConnectionsExplorerBootstrapDI;
