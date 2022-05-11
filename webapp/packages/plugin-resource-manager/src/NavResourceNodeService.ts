/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavTreeResource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';

import { ProjectsResource } from './ProjectsResource';
import { ResourceManagerResource } from './ResourceManagerResource';
import { RESOURCES_NODE_PATH } from './RESOURCES_NODE_PATH';

interface IResourceData {
  projectId: string;
  resourcePath: string;
}

@injectable()
export class NavResourceNodeService {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly projectsResource: ProjectsResource,
    private readonly resourceManagerResource: ResourceManagerResource,
  ) { }

  async saveScript(projectId: string, name: string, script: string) {
    await this.resourceManagerResource.createResource(projectId, name, false);
    await this.resourceManagerResource.writeResource(projectId, name, script);
    await this.syncNodes();
  }

  async delete(nodeId: string) {
    const resourceData = this.getResourceData(nodeId);
    await this.resourceManagerResource.deleteResource(resourceData.projectId, resourceData.resourcePath);
    await this.syncNodes();
  }

  async read(nodeId: string) {
    const resourceData = this.getResourceData(nodeId);
    return await this.resourceManagerResource.readResource(resourceData.projectId, resourceData.resourcePath);
  }

  async write(nodeId: string, value: string) {
    const resourceData = this.getResourceData(nodeId);
    await this.resourceManagerResource.writeResource(resourceData.projectId, resourceData.resourcePath, value);
  }

  private async syncNodes() {
    const userProjectName = await this.getUserProjectName();
    let path = RESOURCES_NODE_PATH;

    if (userProjectName) {
      path = path + '/' + userProjectName;
    }

    await this.navTreeResource.refreshTree(path);
  }

  private getResourceData(nodeId: string): IResourceData {
    const parts = nodeId.replace('//', '\\').split('/');
    const projectId = parts[1];
    const resourcePath = parts.slice(2).join('/');

    return {
      projectId,
      resourcePath,
    };
  }

  private async getUserProjectName() {
    await this.projectsResource.load();
    return this.projectsResource.userProject ? this.projectsResource.userProject.name : '';
  }
}