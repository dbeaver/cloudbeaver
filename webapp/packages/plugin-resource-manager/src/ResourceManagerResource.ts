/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, GraphQLService, ResourceKey, ResourceKeyUtils, RmResource } from '@cloudbeaver/core-sdk';

export type RmResourceInfo = RmResource;
export interface IResourceManagerParams {
  projectId: string;
  folder?: string;
}

@injectable()
export class ResourceManagerResource extends CachedMapResource<IResourceManagerParams, RmResourceInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService
  ) {
    super();
  }

  getFolder(resourcePath: string): string {
    const parts = resourcePath.split('/');
    return parts.slice(0, parts.length - 1).join('/');
  }

  hasResource(key: IResourceManagerParams, resourcePath: string): boolean {
    const resources = this.get(key);

    return resources?.some(resource => resource.name === resourcePath) === true;
  }

  getResource(key: IResourceManagerParams, resourcePath: string): RmResourceInfo | undefined {
    const resources = this.get(key);

    return resources?.find(resource => resource.name === resourcePath);
  }

  async move(projectId: string, oldPath: string, newPath: string): Promise<void> {
    await this.graphQLService.sdk.moveResource({
      projectId,
      newPath,
      oldPath,
    });

    // const oldFolder = this.getFolder(oldPath);
    // const newFolder = this.getFolder(newPath);

    // const oldResource = this.getResource({ projectId, folder: oldFolder }, oldPath);

    // this.set();
  }

  async createResource(projectId: string, resourcePath: string, folder: boolean) {
    await this.graphQLService.sdk.createResource({
      projectId,
      resourcePath,
      isFolder: folder,
    });

    await this.load({ projectId, folder:folder ? resourcePath : this.getFolder(resourcePath) });
  }

  async writeResource(projectId: string, resourcePath: string, data: string, forceOverwrite: boolean) {
    await this.graphQLService.sdk.writeResourceContent({
      projectId,
      resourcePath,
      data,
      forceOverwrite,
    });
  }

  async readResource(projectId: string, resourcePath: string) {
    const result = await this.graphQLService.sdk.readResource({
      projectId,
      resourcePath,
    });

    return result.value;
  }

  async deleteResource(projectId: string, resourcePath: string) {
    await this.graphQLService.sdk.deleteResource({
      projectId,
      resourcePath,
      recursive: false,
    });

    // await this.load({ projectId, folder: folder ? resourcePath : this.getFolder(resourcePath) });
  }

  getKeyRef(key: IResourceManagerParams): IResourceManagerParams {
    if (this.keys.includes(key)) {
      return key;
    }

    const ref = this.keys.find(k => k.projectId === key.projectId && k.folder === key.folder);

    if (ref) {
      return ref;
    }

    return key;
  }

  protected async loader(
    key: ResourceKey<IResourceManagerParams>
  ): Promise<Map<IResourceManagerParams, RmResourceInfo[]>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { projectId, folder } = key;
      const { resources } = await this.graphQLService.sdk.getResourceList({
        projectId,
        folder,
      });

      this.dataSet(key, resources);
    });

    return this.data;
  }
}