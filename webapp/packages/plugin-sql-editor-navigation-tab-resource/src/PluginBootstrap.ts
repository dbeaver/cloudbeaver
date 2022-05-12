/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { INodeNavigationData, NavigationTabsService, NavNodeInfoResource, NavNodeManagerService, NavTreeResource, NodeManagerUtils } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { createPath } from '@cloudbeaver/core-utils';
import { ActionService, ACTION_SAVE, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { NavResourceNodeService, RESOURCE_NODE_TYPE, SaveScriptDialog, ResourceManagerService, ProjectsResource, RESOURCES_NODE_PATH } from '@cloudbeaver/plugin-resource-manager';
import { DATA_CONTEXT_SQL_EDITOR_STATE, SqlEditorService, SQL_EDITOR_ACTIONS_MENU } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorNavigatorService, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { isScript } from './isScript';
import { SCRIPT_EXTENSION } from './SCRIPT_EXTENSION';
import { SqlEditorTabResourceService } from './SqlEditorTabResourceService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly navTreeResource: NavTreeResource,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly projectsResource: ProjectsResource,
    private readonly sqlEditorTabResourceService: SqlEditorTabResourceService,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.sqlEditorTabResourceService.start();
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));

    this.actionService.addHandler({
      id: 'scripts-base-handler',
      isActionApplicable: (context, action) => {
        if (action === ACTION_SAVE) {
          return context.has(DATA_CONTEXT_SQL_EDITOR_STATE);
        }

        return false;
      },
      handler: async (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (action === ACTION_SAVE) {
          const currentTab = this.navigationTabsService.currentTab;
          const resourceTabState = this.sqlEditorTabResourceService.state.get(currentTab?.id ?? '');

          if (resourceTabState) {
            try {
              await this.navResourceNodeService.write(resourceTabState.nodeId, state.query);
              this.notificationService.logSuccess({ title: 'plugin_resource_manager_update_script_success' });
            } catch (exception) {
              this.notificationService.logException(exception as any, 'plugin_resource_manager_update_script_error');
            }
          } else {
            const tabName = this.sqlEditorTabService.getName(state);
            const result = await this.commonDialogService.open(SaveScriptDialog, {
              defaultScriptName: tabName,
            });

            if (result != DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
              try {
                await this.projectsResource.load();
                const scriptName = `${result.trim()}.${SCRIPT_EXTENSION}`;
                const folder = createPath([RESOURCES_NODE_PATH, this.projectsResource.userProject?.name]);
                const nodeId = await this.navResourceNodeService.saveScript(folder, scriptName, state.query);

                await this.navTreeResource.preloadNodeParents(NodeManagerUtils.parentsFromPath(nodeId), nodeId);
                const node = await this.navNodeInfoResource.load(nodeId);

                if (currentTab) {
                  this.sqlEditorTabResourceService.linkTab(currentTab.id, node.id);
                }

                this.sqlEditorService.setName(node.name ?? scriptName, state);
                this.notificationService.logSuccess({ title: 'plugin_resource_manager_save_script_success', message: node.name });

                if (!this.resourceManagerService.enabled) {
                  this.resourceManagerService.toggleEnabled();
                }

              } catch (exception) {
                this.notificationService.logException(exception as any, 'plugin_resource_manager_save_script_error');
              }
            }
          }
        }
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_SAVE) {
          return {
            ...action.info,
            label: '',
          };
        }
        return action.info;
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === SQL_EDITOR_ACTIONS_MENU,
      getItems: (context, items) => [
        ...items,
        ACTION_SAVE,
      ],
    });
  }

  load(): void | Promise<void> { }

  private async navigationHandler(data: INodeNavigationData) {
    try {
      const node = await this.navNodeInfoResource.load(data.nodeId);

      if (node.nodeType !== RESOURCE_NODE_TYPE || !isScript(node.id)) {
        return;
      }

      const tabId = this.sqlEditorTabResourceService.getResourceTab(node.id);

      if (tabId) {
        this.navigationTabsService.selectTab(tabId);
      } else {
        const value = await this.navResourceNodeService.read(node.id);

        const contextProvider = await this.sqlEditorNavigatorService.openNewEditor({
          name: node.name ?? 'Unknown script',
          query: value,
        });

        const context = contextProvider.getContext(this.navigationTabsService.navigationTabContext);

        if (context.tab) {
          this.sqlEditorTabResourceService.linkTab(context.tab.id, node.id);
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
    }
  }
}