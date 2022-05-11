/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavTreeResource, NavNodeInfoResource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';

import { ProjectsResource } from '../ProjectsResource';
import { ResourceManagerResource } from '../ResourceManagerResource';
import { ResourceManagerService } from '../ResourceManagerService';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';

const SCRIPT_EXTENSION = '.sql';

@injectable()
export class ScriptsManagerService {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly projectsResource: ProjectsResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly resourceManagerService: ResourceManagerService,
  ) { }

  isScript(nodeId: string) {
    return nodeId.includes(SCRIPT_EXTENSION);
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
    const parents = await this.getScriptParents(nodeId);
    const resourceData = await this.resourceManagerService.getResourceData(nodeId, parents);

    await this.resourceManagerResource.deleteResource(resourceData.projectId, resourceData.resourcePath);
    await this.syncNodes();
  }

  async readScript(nodeId: string) {
    const parents = await this.getScriptParents(nodeId);
    const resourceData = await this.resourceManagerService.getResourceData(nodeId, parents);

    return await this.resourceManagerResource.readResource(resourceData.projectId, resourceData.resourcePath);
  }

  async writeScript(nodeId: string, value: string) {
    const parents = await this.getScriptParents(nodeId);
    const resourceData = await this.resourceManagerService.getResourceData(nodeId, parents);
    await this.resourceManagerResource.writeResource(resourceData.projectId, resourceData.resourcePath, value);
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

  private async getScriptParents(nodeId: string) {
    return [RESOURCES_NODE_PATH, await this.getScriptsPath()];
  }
}