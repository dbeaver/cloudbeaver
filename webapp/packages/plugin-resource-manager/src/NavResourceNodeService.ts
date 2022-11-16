/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { IResourceManagerParams, ResourceManagerResource, RmResourceInfo } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';

import { RESOURCES_NODE_PATH } from './RESOURCES_NODE_PATH';

export const PROJECT_NODE_TYPE = 'rm.project';
export const RESOURCE_NODE_TYPE = 'rm.resource';

@injectable()
export class NavResourceNodeService {
  constructor(
    private readonly resourceManagerResource: ResourceManagerResource,
  ) { }

  async loadResourceInfo(key: IResourceManagerParams): Promise<RmResourceInfo | undefined> {
    return (await this.resourceManagerResource.load(key))[0];
  }

  async move(key: IResourceManagerParams, newKey: IResourceManagerParams): Promise<string> {
    await this.resourceManagerResource.move(key, newKey);

    return createPath(RESOURCES_NODE_PATH, newKey.projectId, newKey.path, newKey.name);
  }

  async delete(key: IResourceManagerParams) {
    await this.resourceManagerResource.deleteResource(key);
  }

  async read(key: IResourceManagerParams): Promise<string> {
    return await this.resourceManagerResource.readText(key);
  }

  async write(key: IResourceManagerParams, value: string) {
    await this.resourceManagerResource.writeText(
      key,
      value,
      true
    );
  }

  async setProperties(key: IResourceManagerParams, diff: Record<string, any>): Promise<Record<string, any>> {
    return await this.resourceManagerResource.setProperties(
      key,
      diff
    );
  }
}