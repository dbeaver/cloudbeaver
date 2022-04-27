/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DATA_CONTEXT_NAV_NODE, MENU_NAV_TREE, NavigationTabsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { SqlEditorService } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ACTION_OPEN_SCRIPT } from './Actions/ACTION_OPEN_SCRIPT';
import { ACTION_OPEN_SCRIPT_IN_CURRENT_TAB } from './Actions/ACTION_OPEN_SCRIPT_IN_CURRENT_TAB';
import { ScriptsManagerService } from './ScriptsManagerService';

@injectable()
export class ResourceManagerMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly scriptsManagerService: ScriptsManagerService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly navigationTabsService: NavigationTabsService
  ) { }

  register() {
    this.actionService.addHandler({
      id: 'resource-manager-base-actions',
      isActionApplicable: (contexts, action) => {
        if (!contexts.has(DATA_CONTEXT_NAV_NODE)) {
          return false;
        }

        const node = contexts.get(DATA_CONTEXT_NAV_NODE);
        const isScript = this.scriptsManagerService.isScript(node.id);

        switch (action) {
          case ACTION_OPEN_SCRIPT:
            return isScript;
          case ACTION_OPEN_SCRIPT_IN_CURRENT_TAB: {
            const selectedTab = this.sqlEditorTabService.sqlEditorTabs.find(
              tab => tab.id === this.navigationTabsService.currentTabId
            );

            return isScript && !!selectedTab;
          }
          default:
            return false;
        }
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        try {
          if (action === ACTION_OPEN_SCRIPT) {
            await this.scriptsManagerService.openScript(node.id);
          } else {
            const selectedTab = this.sqlEditorTabService.sqlEditorTabs.find(
              tab => tab.id === this.navigationTabsService.currentTabId
            );

            if (selectedTab) {
              const script = await this.scriptsManagerService.readScript(node.id);
              /* we need access to the SQLEditorData object so we can set query properly */
              this.sqlEditorService.setQuery(script, selectedTab.handlerState);

              /* in case of associatedScriptId exists in state we should show dialog and ask whether user wants to relink editor or not */
              if (!selectedTab.handlerState.associatedScriptId) {
                this.sqlEditorService.linkScript(node.id, selectedTab.handlerState);
              }
            }
          }
        } catch (exception) {
          this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_NAV_TREE,
      getItems: (context, items) => [
        ACTION_OPEN_SCRIPT,
        ACTION_OPEN_SCRIPT_IN_CURRENT_TAB,
        ...items,
      ],
    });
  }
}