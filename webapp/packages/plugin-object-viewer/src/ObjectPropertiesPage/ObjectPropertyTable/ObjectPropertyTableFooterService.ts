/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { DataContext } from '@cloudbeaver/core-data-context';
import {
  DATA_CONTEXT_NAV_NODE,
  DATA_CONTEXT_NAV_NODES,
  type NavNode,
  NavTreeResource,
  NavTreeSettingsService,
} from '@cloudbeaver/core-navigation-tree';
import { ACTION_DELETE, ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { MENU_NAVIGATION_TREE_MANAGE, NodeDeletionService } from '@cloudbeaver/plugin-navigation-tree';

import { MENU_OBJECT_VIEWER_FOOTER } from './MENU_OBJECT_VIEWER_FOOTER.js';

@injectable(() => [NavTreeResource, NodeDeletionService, NavTreeSettingsService, MenuService, ActionService])
export class ObjectPropertyTableFooterService {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly nodeDeletionService: NodeDeletionService,
    private readonly navTreeSettingsService: NavTreeSettingsService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
  ) {}

  registerFooterActions() {
    this.menuService.addCreator({
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      contexts: [DATA_CONTEXT_NAV_NODES],
      isApplicable: () => this.navTreeSettingsService.deleting,
      getItems: (_, items) => [...items, ACTION_DELETE],
    });

    this.actionService.addHandler({
      id: 'object-viewer-footer-base',
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      contexts: [DATA_CONTEXT_NAV_NODES],
      actions: [ACTION_DELETE],
      getActionInfo: (_, action) => {
        if (action === ACTION_DELETE) {
          return {
            ...action.info,
            icon: 'delete',
          };
        }

        return action.info;
      },
      isDisabled: (context, action) => {
        if (action === ACTION_DELETE) {
          const selected = context.get(DATA_CONTEXT_NAV_NODES)!();
          return this.nodeDeletionService.isDeleting || this.navTreeResource.isLoading() || !selected.some(node => this.canDelete(node));
        }

        return true;
      },
      handler: async (context, action) => {
        if (action === ACTION_DELETE) {
          const selected = context.get(DATA_CONTEXT_NAV_NODES)!();
          await this.nodeDeletionService.delete(selected);
        }
      },
    });
  }

  private canDelete(node: NavNode): boolean {
    const context = new DataContext();
    context.set(DATA_CONTEXT_NAV_NODE, node, 'object-viewer-delete');
    context.set(DATA_CONTEXT_MENU, MENU_NAVIGATION_TREE_MANAGE, 'object-viewer-delete');

    const action = this.actionService.getAction(context, ACTION_DELETE);
    return !!action && !action.isHidden() && !action.isDisabled();
  }
}
