/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavTreeResource, NavNodeInfoResource, NavigationTabsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SqlEditorNavigatorService, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ProjectsResource } from '../ProjectsResource';
import { ResourceManagerResource } from '../ResourceManagerResource';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';

const SCRIPT_EXTENSION = '.sql';

@injectable()
export class ScriptsManagerService {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly projectsResource: ProjectsResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly resourceManagerResource: ResourceManagerResource
  ) {

  }

  isScript(nodeId: string) {
    return nodeId.includes(SCRIPT_EXTENSION);
  }

  async openScript(nodeId: string) {
    try {
      const existingTab = this.sqlEditorTabService.sqlEditorTabs.find(
        tab => tab.handlerState.associatedScriptId === nodeId
      );

      if (existingTab) {
        this.navigationTabsService.selectTab(existingTab.id);
      } else {
        const scriptValue = await this.readScript(nodeId);

        const node = await this.navNodeInfoResource.load(nodeId);
        await this.sqlEditorNavigatorService.openNewEditor({
          name: node.name ?? 'Unknown script',
          query: scriptValue,
          associatedScriptId: nodeId,
        });
      }
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
    }
  }

  async saveScript(name: string, script: string) {
    name = name + SCRIPT_EXTENSION;
    const projectName = await this.getUserProjectName();
    await this.resourceManagerResource.createResource(projectName, name, false);
    await this.resourceManagerResource.writeResource(projectName, name, script);
    await this.syncNodes();

    const nodeId = await this.getNodeIdFromScript(name);
    const node = await this.navNodeInfoResource.load(nodeId);

    return node;
  }

  async deleteScript(nodeId: string) {
    const node = await this.navNodeInfoResource.load(nodeId);
    const projectName = await this.getUserProjectName();
    if (node.name) {
      await this.resourceManagerResource.deleteResource(projectName, node.name);
      await this.syncNodes();
    }
  }

  async readScript(nodeId: string) {
    const node = await this.navNodeInfoResource.load(nodeId);

    if (!node.name) {
      return;
    }

    const projectName = await this.getUserProjectName();
    return await this.resourceManagerResource.readResource(projectName, node.name);
  }

  async writeScript(nodeId: string, value: string) {
    const node = await this.navNodeInfoResource.load(nodeId);

    if (node.name) {
      const projectName = await this.getUserProjectName();
      await this.resourceManagerResource.writeResource(projectName, node.name, value);
    }

    return node;
  }

  private async getNodeIdFromScript(scriptName: string) {
    const scriptsPath = await this.getScriptsPath();
    return `${scriptsPath}/${scriptName}`;
  }

  private async syncNodes() {
    await this.navTreeResource.refreshTree(await this.getScriptsPath());
  }

  private async getScriptsPath() {
    const userProjectName = await this.getUserProjectName();

    if (userProjectName) {
      return `${RESOURCES_NODE_PATH}/${userProjectName}`;
    }

    return RESOURCES_NODE_PATH;
  }

  private async getUserProjectName() {
    await this.projectsResource.load();
    return this.projectsResource.userProject ? this.projectsResource.userProject.name : '';
  }
}