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
import { NavNodeManagerService, NavNodeInfoResource, type INodeNavigationData, NavigationType } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { createChildResourceKey, NAV_NODE_TYPE_RM_RESOURCE, ResourceManagerResource, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { DATA_CONTEXT_TAB_ID } from '@cloudbeaver/core-ui';
import { createPath } from '@cloudbeaver/core-utils';
import { ActionService, ACTION_SAVE, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { NavResourceNodeService, ResourceManagerService, getResourceKeyFromNodeId } from '@cloudbeaver/plugin-resource-manager';
import { ResourceManagerScriptsService, SaveScriptDialog } from '@cloudbeaver/plugin-resource-manager-scripts';
import { DATA_CONTEXT_SQL_EDITOR_STATE, getSqlEditorName, SqlDataSourceService, SqlEditorSettingsService, SQL_EDITOR_ACTIONS_MENU } from '@cloudbeaver/plugin-sql-editor';
import { isSQLEditorTab, SqlEditorNavigatorService, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { isScript } from './isScript';
import { ResourceSqlDataSource } from './ResourceSqlDataSource';
import { SCRIPT_EXTENSION } from './SCRIPT_EXTENSION';
import { SqlEditorTabResourceService } from './SqlEditorTabResourceService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly projectsService: ProjectsService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly sqlEditorTabResourceService: SqlEditorTabResourceService,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly resourceManagerScriptsService: ResourceManagerScriptsService,
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
          let projectId = dataSource.executionContext?.projectId ?? null;
          await this.projectInfoResource.load(CachedMapAllKey);
          const name = getSqlEditorName(state, dataSource);

          if (projectId) {
            const project = this.projectInfoResource.get(projectId);

            if (!project?.canEditResources) {
              projectId = null;
            }
          }

          const result = await this.commonDialogService.open(SaveScriptDialog, {
            defaultScriptName: name,
            projectId,
          });

          if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
            try {
              projectId = result.projectId;

              if (!projectId) {
                throw new Error('Project not selected');
              }

              const project = this.projectInfoResource.get(projectId);
              if (!project) {
                throw new Error('Project not found');
              }

              const scriptName = `${result.name.trim()}.${SCRIPT_EXTENSION}`;
              const scriptsRootFolder = this.resourceManagerScriptsService.getRootFolder(project);
              const folderResourceKey = getResourceKeyFromNodeId(
                createPath(RESOURCES_NODE_PATH, projectId, scriptsRootFolder)
              );

              if (!folderResourceKey) {
                this.notificationService.logError({ title: 'ui_error', message: 'plugin_sql_editor_navigation_tab_resource_save_script_error' });
                return;
              }

              const resourceKey = createChildResourceKey(folderResourceKey, scriptName);
              await this.resourceManagerResource.writeText(
                resourceKey,
                dataSource.script,
                false
              );

              if (tab && isSQLEditorTab(tab)) {
                const previousDataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
                const dataSource = this.sqlDataSourceService.create(
                  tab.handlerState,
                  ResourceSqlDataSource.key,
                ) as ResourceSqlDataSource;

                dataSource.setResourceKey(resourceKey);

                if (previousDataSource?.executionContext) {
                  dataSource.setExecutionContext(previousDataSource.executionContext);
                }
              }

              this.notificationService.logSuccess({ title: 'plugin_sql_editor_navigation_tab_resource_save_script_success', message: resourceKey.name });

              if (!this.resourceManagerScriptsService.active) {
                this.resourceManagerScriptsService.togglePanel();
              }

            } catch (exception) {
              this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_save_script_error');
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
      const nodeInfo = contexts.getContext(this.navNodeManagerService.navigationNavNodeContext);
      const node = this.navNodeInfoResource.get(data.nodeId);

      if (!node || node.nodeType !== NAV_NODE_TYPE_RM_RESOURCE || !isScript(node.id)) {
        return;
      }

      const resourceKey = getResourceKeyFromNodeId(node.id);

      if (!resourceKey) {
        return;
      }

      nodeInfo.markOpen();

      if (data.type !== NavigationType.open) {
        return;
      }

      const resource = await this.navResourceNodeService.loadResourceInfo(resourceKey);

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

      const tab = this.sqlEditorTabResourceService.getResourceTab(resourceKey);

      if (tab) {
        this.navigationTabsService.selectTab(tab.id);
      } else {
        const contextProvider = await this.sqlEditorNavigatorService.openNewEditor({
          name: resourceKey.name ?? 'Unknown script',
          dataSourceKey: ResourceSqlDataSource.key,
        });

        const context = contextProvider.getContext(this.navigationTabsService.navigationTabContext);

        if (context.tab && isSQLEditorTab(context.tab)) {
          const previousDataSource = this.sqlDataSourceService.get(context.tab.handlerState.editorId);

          const dataSource = this.sqlDataSourceService.create(
            context.tab.handlerState,
            ResourceSqlDataSource.key,
          ) as ResourceSqlDataSource;


          dataSource.setResourceKey(resourceKey);

          if (previousDataSource?.executionContext) {
            dataSource.setExecutionContext(previousDataSource.executionContext);
          }

          this.sqlEditorTabService.attachToProject(context.tab, resourceKey.projectId);
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_open_script_error');
    }
  }
}