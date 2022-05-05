/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { NavTreeResource, NavNodeInfoResource, NavNode, NavigationTabsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SqlEditorNavigatorService, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ProjectsResource } from '../ProjectsResource';
import { ResourceManagerService } from '../ResourceManagerService';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';

const SCRIPT_EXTENSION = '.sql';

@injectable()
export class ScriptsManagerService {
  get userProjectPath(): string {
    const projectName = this.projectsResource.userProjectName ? '/' + this.projectsResource.userProjectName : '';
    return `${RESOURCES_NODE_PATH}${projectName}`;
  }

  constructor(
    private readonly resourceManagerService: ResourceManagerService,
    private readonly navTreeResource: NavTreeResource,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly projectsResource: ProjectsResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService
  ) {
    this.openScript = this.openScript.bind(this);

    makeObservable(this, {
      userProjectPath: computed,
    });
  }

  isScript(nodeId: string) {
    return nodeId.includes(SCRIPT_EXTENSION);
  }

  async openScript(node: NavNode) {
    try {
      const existingTab = this.sqlEditorTabService.sqlEditorTabs.find(
        tab => tab.handlerState.associatedScriptId === node.id
      );

      if (existingTab) {
        this.navigationTabsService.selectTab(existingTab.id);
      } else {
        const scriptValue = await this.readScript(node.id);

        await this.sqlEditorNavigatorService.openNewEditor({
          name: node.name ?? 'Unknown script',
          query: scriptValue,
          associatedScriptId: node.id,
        });
      }
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
    }
  }

  async saveScript(name: string, script: string) {
    name = name + SCRIPT_EXTENSION;
    await this.resourceManagerService.createResource(this.projectsResource.userProjectName, name, false);
    await this.resourceManagerService.writeResource(this.projectsResource.userProjectName, name, script);
    await this.syncNodes();

    const nodeId = this.getNodeIdFromScript(name);
    const node = await this.navNodeInfoResource.load(nodeId);

    return node;
  }

  async deleteScript(nodeId: string) {
    const node = await this.navNodeInfoResource.load(nodeId);
    if (node.name) {
      await this.resourceManagerService.deleteResource(this.projectsResource.userProjectName, node.name);
      await this.syncNodes();
    }
  }

  async readScript(nodeId: string) {
    const node = await this.navNodeInfoResource.load(nodeId);

    if (!node.name) {
      return;
    }

    return await this.resourceManagerService.readResource(this.projectsResource.userProjectName, node.name);
  }

  async writeScript(nodeId: string, value: string) {
    const node = await this.navNodeInfoResource.load(nodeId);

    if (node.name) {
      await this.resourceManagerService.writeResource(this.projectsResource.userProjectName, node.name, value);
    }

    return node;
  }

  private getNodeIdFromScript(scriptName: string) {
    return `${this.userProjectPath}/${scriptName}`;
  }

  private async syncNodes() {
    await this.navTreeResource.refreshTree(this.userProjectPath);
  }
}