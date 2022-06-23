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
import { DATA_CONTEXT_SQL_EDITOR_STATE, getSqlEditorName, SqlDataSourceService, SqlEditorService, SQL_EDITOR_ACTIONS_MENU } from '@cloudbeaver/plugin-sql-editor';
import { isSQLEditorTab, SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { isScript } from './isScript';
import { ResourceSqlDataSource } from './ResourceSqlDataSource';
import { SCRIPT_EXTENSION } from './SCRIPT_EXTENSION';
import { SqlEditorTabResourceService } from './SqlEditorTabResourceService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly navTreeResource: NavTreeResource,
    private readonly navResourceNodeService: NavResourceNodeService,
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
    private readonly sqlDataSourceService: SqlDataSourceService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));

    this.actionService.addHandler({
      id: 'scripts-base-handler',
      isActionApplicable: (context, action): boolean => {
        if (action === ACTION_SAVE) {
          const state = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

          if (!state) {
            return false;
          }

          return !(this.sqlDataSourceService.get(state.editorId) instanceof ResourceSqlDataSource);
        }

        return false;
      },
      handler: async (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);
        const dataSource = this.sqlDataSourceService.get(state.editorId);
        const tab = this.navigationTabsService.currentTab;

        if (!dataSource) {
          return;
        }

        if (action === ACTION_SAVE) {
          const name = getSqlEditorName(state);
          const result = await this.commonDialogService.open(SaveScriptDialog, {
            defaultScriptName: name,
          });

          if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
            try {
              await this.projectsResource.load();
              const scriptName = `${result.trim()}.${SCRIPT_EXTENSION}`;
              const folder = createPath([RESOURCES_NODE_PATH, this.projectsResource.userProject?.name]);
              const nodeId = await this.navResourceNodeService.saveScript(folder, scriptName, dataSource.script);

              await this.navTreeResource.preloadNodeParents(NodeManagerUtils.parentsFromPath(nodeId), nodeId);
              const node = await this.navNodeInfoResource.load(nodeId);

              if (tab && isSQLEditorTab(tab)) {
                const previousDataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
                const dataSource = this.sqlDataSourceService.create(
                  tab.handlerState,
                  ResourceSqlDataSource.key,
                ) as ResourceSqlDataSource;

                const nodeId = node.id;
                const parents = NodeManagerUtils.parentsFromPath(nodeId);

                dataSource.setNodeInfo({
                  nodeId,
                  parents,
                });

                if (previousDataSource) {
                  dataSource.setExecutionContext(previousDataSource.executionContext);
                }
              }

              this.sqlEditorService.setName(node.name ?? scriptName, state);
              this.notificationService.logSuccess({ title: 'plugin_resource_manager_save_script_success', message: node.name });

              if (!this.resourceManagerService.panelEnabled) {
                this.resourceManagerService.togglePanel();
              }

            } catch (exception) {
              this.notificationService.logException(exception as any, 'plugin_resource_manager_save_script_error');
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
      isApplicable: context => this.resourceManagerService.enabled
        && context.get(DATA_CONTEXT_MENU) === SQL_EDITOR_ACTIONS_MENU,
      getItems: (context, items) => [
        ...items,
        ACTION_SAVE,
      ],
    });
  }

  load(): void | Promise<void> { }

  private async navigationHandler(data: INodeNavigationData) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    try {
      const node = await this.navNodeInfoResource.load(data.nodeId);

      if (node.nodeType !== RESOURCE_NODE_TYPE || !isScript(node.id)) {
        return;
      }

      const tab = this.sqlEditorTabResourceService.getResourceTab(node.id);

      if (tab) {
        this.navigationTabsService.selectTab(tab.id);
      } else {
        const contextProvider = await this.sqlEditorNavigatorService.openNewEditor({
          name: node.name ?? 'Unknown script',
          dataSourceKey: ResourceSqlDataSource.key,
        });

        const context = contextProvider.getContext(this.navigationTabsService.navigationTabContext);

        if (context.tab && isSQLEditorTab(context.tab)) {
          const previousDataSource = this.sqlDataSourceService.get(context.tab.handlerState.editorId);

          const dataSource = this.sqlDataSourceService.create(
            context.tab.handlerState,
            ResourceSqlDataSource.key,
          ) as ResourceSqlDataSource;

          const nodeId = node.id;
          const parents = NodeManagerUtils.parentsFromPath(nodeId);

          dataSource.setNodeInfo({
            nodeId,
            parents,
          });

          if (previousDataSource) {
            dataSource.setExecutionContext(previousDataSource.executionContext);
          }
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
    }
  }
}