/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NavTreeResource, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { createPath } from '@cloudbeaver/core-utils';

import { isRMNavNode } from './isRMNavNode';
import { IResourceManagerParams, ResourceManagerResource, RmResourceInfo } from './ResourceManagerResource';
import { RESOURCES_NODE_PATH } from './RESOURCES_NODE_PATH';

interface IResourceData {
  key: IResourceManagerParams;
  resourcePath: string;
  name: string;
  nodeId: string;
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

  async loadResourceInfo(resourceData: IResourceData): Promise<RmResourceInfo | undefined> {
    await this.resourceManagerResource.load(resourceData.key);
    return this.resourceManagerResource.getResource(resourceData.key, resourceData.name);
  }

  async saveScript(resourceData: IResourceData, name: string, script: string): Promise<string> {
    const resourcePath = createPath(resourceData.resourcePath, name);
    // await this.resourceManagerResource.createResource(resourceData.key.projectId, resourcePath, false);
    await this.resourceManagerResource.writeResource(resourceData.key.projectId, resourcePath, script, false);
    await this.navTreeResource.refreshTree(resourceData.nodeId);

    return createPath(RESOURCES_NODE_PATH, resourceData.key.projectId, resourcePath);
  }

  async delete(resourceData: IResourceData) {
    const node = await this.navNodeInfoResource.load(resourceData.nodeId);
    await this.resourceManagerResource.deleteResource(resourceData.key.projectId, resourceData.resourcePath);
    this.navTreeResource.deleteInNode(node.parentId, [resourceData.nodeId]);
  }

  async read(resourceData: IResourceData): Promise<string> {
    return await this.resourceManagerResource.readResource(resourceData.key.projectId, resourceData.resourcePath);
  }

  async write(resourceData: IResourceData, value: string) {
    await this.resourceManagerResource.writeResource(
      resourceData.key.projectId,
      resourceData.resourcePath,
      value,
      true
    );
  }

  async setProperties(resourceData: IResourceData, diff: Record<string, any>): Promise<Record<string, any>> {
    return await this.resourceManagerResource.setResourceProperties(
      resourceData.key.projectId,
      resourceData.resourcePath,
      diff
    );
  }

  async getProperties(resourceData: IResourceData): Promise<Record<string, any>> {
    const resource = await this.loadResourceInfo(resourceData);

    return resource?.properties ?? {};
  }

  getResourceData(nodeId: string): IResourceData | undefined {
    if (!isRMNavNode(nodeId)) {
      return;
    }

    const parts = nodeId.replace('//', '\\').split('/');
    const projectId = parts[1];
    const resourcePath = parts.slice(2).join('/');
    const name = parts[parts.length - 1];

    let folder: string | undefined = undefined;
    const folders = parts.slice(2, parts.length - 1);
    if (folders.length > 0) {
      folder = folders.join('/');
    }

    return {
      key: { projectId, folder },
      resourcePath,
      name,
      nodeId,
    };
  }
}