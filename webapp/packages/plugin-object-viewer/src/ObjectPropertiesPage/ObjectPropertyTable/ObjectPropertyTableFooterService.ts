/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODES, ENodeFeature, NavTreeResource, NavTreeSettingsService } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { ACTION_DELETE, ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';

import { MENU_OBJECT_VIEWER_FOOTER } from './MENU_OBJECT_VIEWER_FOOTER';

@injectable()
export class ObjectPropertyTableFooterService {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly notificationService: NotificationService,
    private readonly navTreeSettingsService: NavTreeSettingsService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
  ) {}

  registerFooterActions() {
    this.menuService.addCreator({
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      isApplicable: context => {
        const selected = context.tryGet(DATA_CONTEXT_NAV_NODES);
        return selected !== undefined && this.navTreeSettingsService.deleting;
      },
      getItems: (_, items) => [...items, ACTION_DELETE],
    });

    this.actionService.addHandler({
      id: 'object-viewer-footer-base',
      isActionApplicable: (context, action) => {
        const menu = context.hasValue(DATA_CONTEXT_MENU, MENU_OBJECT_VIEWER_FOOTER);

        if (!menu || !context.has(DATA_CONTEXT_NAV_NODES)) {
          return false;
        }

        return [ACTION_DELETE].includes(action);
      },
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
          const selected = context.get(DATA_CONTEXT_NAV_NODES)();
          return !selected.some(node => node.features?.includes(ENodeFeature.canDelete)) || this.navTreeResource.isLoading();
        }

        return true;
      },
      handler: async (context, action) => {
        if (action === ACTION_DELETE) {
          const selected = context.get(DATA_CONTEXT_NAV_NODES)();
          const nodes = selected.filter(node => node.features?.includes(ENodeFeature.canDelete));

          try {
            await this.navTreeResource.deleteNode(resourceKeyList(nodes.map(node => node.id)));
          } catch (exception: any) {
            this.notificationService.logException(exception, 'plugin_object_viewer_delete_object_fail');
          }
        }
      },
    });
  }
}
