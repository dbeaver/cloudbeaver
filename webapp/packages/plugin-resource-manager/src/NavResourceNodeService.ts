/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { createPath } from '@cloudbeaver/core-utils';

import { ResourceManagerResource } from './ResourceManagerResource';
import { RESOURCES_NODE_PATH } from './RESOURCES_NODE_PATH';

interface IResourceData {
  projectId: string;
  resourcePath: string;
}

export const PROJECT_NODE_TYPE = 'rm.project';
export const RESOURCE_NODE_TYPE = 'rm.resource';

@injectable()
export class NavResourceNodeService {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly resourceManagerResource: ResourceManagerResource,
  ) { }

  async saveScript(folderNodeId: string, name: string, script: string) {
    const resourceData = this.getResourceData(folderNodeId);
    const resourcePath = createPath([resourceData.resourcePath, name]);
    await this.resourceManagerResource.createResource(resourceData.projectId, resourcePath, false);
    await this.resourceManagerResource.writeResource(resourceData.projectId, resourcePath, script);
    await this.navTreeResource.refreshTree(folderNodeId);

    return createPath([RESOURCES_NODE_PATH, resourceData.projectId, resourcePath]);
  }

  async delete(nodeId: string) {
    const resourceData = this.getResourceData(nodeId);
    const node = await this.navNodeInfoResource.load(nodeId);
    await this.resourceManagerResource.deleteResource(resourceData.projectId, resourceData.resourcePath);
    this.navTreeResource.deleteInNode(node.parentId, [nodeId]);
  }

  async read(nodeId: string) {
    const resourceData = this.getResourceData(nodeId);
    return await this.resourceManagerResource.readResource(resourceData.projectId, resourceData.resourcePath);
  }

  async write(nodeId: string, value: string) {
    const resourceData = this.getResourceData(nodeId);
    await this.resourceManagerResource.writeResource(resourceData.projectId, resourceData.resourcePath, value);
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
}