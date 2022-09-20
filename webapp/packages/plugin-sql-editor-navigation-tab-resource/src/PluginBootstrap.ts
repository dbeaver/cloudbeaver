/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { NavNodeManagerService, NavTreeResource, NavNodeInfoResource, NodeManagerUtils, type INodeNavigationData, NavigationType } from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { DATA_CONTEXT_TAB_ID } from '@cloudbeaver/core-ui';
import { createPath } from '@cloudbeaver/core-utils';
import { ActionService, ACTION_SAVE, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { NavResourceNodeService, RESOURCE_NODE_TYPE, SaveScriptDialog, ResourceManagerService, RESOURCES_NODE_PATH, ResourceProjectsResource } from '@cloudbeaver/plugin-resource-manager';
import { DATA_CONTEXT_SQL_EDITOR_STATE, getSqlEditorName, SqlDataSourceService, SqlEditorService, SqlEditorSettingsService, SQL_EDITOR_ACTIONS_MENU } from '@cloudbeaver/plugin-sql-editor';
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
    private readonly projectsService: ProjectsService,
    private readonly resourceProjectsResource: ResourceProjectsResource,
    private readonly sqlEditorTabResourceService: SqlEditorTabResourceService,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));

    this.actionService.addHandler({
      id: 'scripts-base-handler',
      isActionApplicable: (context, action): boolean => {
        if (action === ACTION_SAVE) {
          const tabId = context.tryGet(DATA_CONTEXT_TAB_ID);
          const state = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

          if (!state || !tabId) {
            return false;
          }

          if (!this.projectsService.activeProjects.some(project => project.canEditResources)) {
            return false;
          }

          return !(this.sqlDataSourceService.get(state.editorId) instanceof ResourceSqlDataSource);
        }

        return false;
      },
      handler: async (context, action) => {
        const tabId = context.get(DATA_CONTEXT_TAB_ID);
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        const dataSource = this.sqlDataSourceService.get(state.editorId);
        const tab = this.navigationTabsService.getTab(tabId);

        if (!dataSource) {
          return;
        }

        if (action === ACTION_SAVE) {
          const name = getSqlEditorName(state, dataSource);
          const result = await this.commonDialogService.open(SaveScriptDialog, {
            defaultScriptName: name,
          });

          if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
            try {
              if (!result.projectId) {
                throw new Error('Project not selected');
              }

              await this.resourceProjectsResource.load();
              const scriptName = `${result.name.trim()}.${SCRIPT_EXTENSION}`;
              const folder = createPath(RESOURCES_NODE_PATH, result.projectId);
              const resourceData = this.navResourceNodeService.getResourceData(folder);

              if (!resourceData) {
                this.notificationService.logError({ title: 'ui_error', message: 'plugin_resource_manager_save_script_error' });
                return;
              }

              const nodeId = await this.navResourceNodeService.saveScript(resourceData, scriptName, dataSource.script);


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

              if (!this.resourceManagerService.active) {
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

  private async navigationHandler(
    data: INodeNavigationData,
    contexts: IExecutionContextProvider<INodeNavigationData>
  ) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    try {
      const nodeInfo = await contexts.getContext(this.navNodeManagerService.navigationNavNodeContext);
      const node = await this.navNodeInfoResource.load(data.nodeId);

      if (node.nodeType !== RESOURCE_NODE_TYPE || !isScript(node.id)) {
        return;
      }

      const resourceData = this.navResourceNodeService.getResourceData(node.id);

      if (!resourceData) {
        return;
      }

      const resource = await this.navResourceNodeService.loadResourceInfo(resourceData);

      if (!resource) {
        if (data.type === NavigationType.open) {
          throw new Error('Resource not found');
        } else {
          return;
        }
      }

      nodeInfo.markOpen();

      if (data.type !== NavigationType.open) {
        return;
      }

      const maxSize = this.sqlEditorSettingsService.settings.isValueDefault('maxFileSize')
        ? this.sqlEditorSettingsService.deprecatedSettings.getValue('maxFileSize')
        : this.sqlEditorSettingsService.settings.getValue('maxFileSize');
      const size = Math.round(resource.length / 1000); // kilobyte

      if (size > maxSize) {
        this.notificationService.logInfo({
          title: 'sql_editor_upload_script_max_size_title',
          message: `Max size: ${maxSize}KB\nFile size: ${size}KB`,
          autoClose: false,
        });

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