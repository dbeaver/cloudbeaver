/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { NavigationTreeService, DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS } from '@cloudbeaver/plugin-navigation-tree';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, type IAction, KeyBindingService, MenuService } from '@cloudbeaver/core-view';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';

import { ACTION_LINK_OBJECT } from './ACTION_LINK_OBJECT.js';
import { KEY_BINDING_LINK_OBJECT } from './KEY_BINDING_LINK_OBJECT.js';

@injectable(() => [
  ActionService,
  KeyBindingService,
  NavigationTreeService,
  ConnectionSchemaManagerService,
  MenuService,
  ConnectionInfoResource,
  NavNodeInfoResource,
])
export class ObjectViewerNavTreeLinkMenuService extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly navigationTreeService: NavigationTreeService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly menuService: MenuService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();
  }

  override register() {
    this.navigationTreeService.registerAction(ACTION_LINK_OBJECT);

    this.actionService.addHandler({
      id: 'object-viewer-nav-tree-link-handler',
      contexts: [DATA_CONTEXT_ELEMENTS_TREE],
      actions: [ACTION_LINK_OBJECT],
      isHidden: context => {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;

        const { path } = this.getActiveNode(tree.baseRoot);
        return !path?.includes(tree.baseRoot);
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_ELEMENTS_TREE_TOOLS],
      getItems: (context, items) => [ACTION_LINK_OBJECT, ...items],
    });

    this.registerBindings();
  }

  private registerBindings() {
    this.actionService.addHandler({
      id: 'elements-tree-object-viewer-link-base',
      contexts: [DATA_CONTEXT_ELEMENTS_TREE],
      actions: [ACTION_LINK_OBJECT],
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'elements-tree-object-viewer-link',
      binding: KEY_BINDING_LINK_OBJECT,
      actions: [ACTION_LINK_OBJECT],
      handler: this.elementsTreeActionHandler.bind(this),
    });
  }

  private async elementsTreeActionHandler(contexts: IDataContextProvider, action: IAction) {
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

    if (tree === undefined) {
      return;
    }

    switch (action) {
      case ACTION_LINK_OBJECT: {
        for (const loader of this.connectionSchemaManagerService.currentObjectLoaders) {
          await loader.load();
        }

        const { id, path } = this.getActiveNode(tree.baseRoot);

        if (id && path) {
          await this.navigationTreeService.showNode(id, path);
        }

        break;
      }
    }
  }

  private getActiveNode(baseRoot: string): {
    id: string | undefined;
    path: string[] | undefined;
  } {
    const navNode = this.connectionSchemaManagerService.activeNavNode;
    const activeConnectionKey = this.connectionSchemaManagerService.activeConnectionKey;

    let id = navNode?.nodeId;
    let path = navNode?.path;

    if (!path?.includes(baseRoot) && activeConnectionKey) {
      const connection = this.connectionInfoResource.get(activeConnectionKey);

      if (connection?.nodePath && connection.connected) {
        id = connection.nodePath;
        path = this.navNodeInfoResource.getParents(connection.nodePath);
      }
    }

    return { id, path };
  }
}
