/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DATA_CONTEXT_NAV_NODE, MENU_NAV_TREE } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ACTION_OPEN_SCRIPT } from './Actions/ACTION_OPEN_SCRIPT';
import { ResourceManagerService } from './ResourceManagerService';
import { ScriptsManagerService } from './ScriptsManagerService';

@injectable()
export class ResourceManagerMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly scriptsManagerService: ScriptsManagerService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly notificationService: NotificationService,
  ) { }

  private async openScript(id: string) {
    const name = this.resourceManagerService.getResourceName(id) || 'Unknown script';
    const scriptValue = await this.scriptsManagerService.readScript(name);

    await this.sqlEditorNavigatorService.openNewEditor({
      name,
      query: scriptValue,
    });
  }

  register() {
    this.actionService.addHandler({
      id: 'resource-manager-base-actions',
      isActionApplicable: (contexts, action) => {
        if (action === ACTION_OPEN_SCRIPT && contexts.has(DATA_CONTEXT_NAV_NODE)) {
          const node = contexts.get(DATA_CONTEXT_NAV_NODE);
          return this.scriptsManagerService.isScript(node.id);
        }
        return false;
      },
      handler: async context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        try {
          await this.openScript(node.id);
        } catch (exception) {
          this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_NAV_TREE,
      getItems: (context, items) => [
        ACTION_OPEN_SCRIPT,
        ...items,
      ],
    });
  }
}