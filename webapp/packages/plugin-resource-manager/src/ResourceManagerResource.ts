/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, GraphQLService, ResourceKey, ResourceKeyUtils, RmResource } from '@cloudbeaver/core-sdk';
import { isValuesEqual } from '@cloudbeaver/core-utils';

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

  getResourceName(resourcePath: string): string {
    const parts = resourcePath.split('/');
    return parts[parts.length - 1];
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

  async loadProperties(
    projectId: string,
    resourcePath: string
  ): Promise<Record<string, any>> {
    const folder = this.getFolder(resourcePath);
    const nameMask = this.getResourceName(resourcePath);
    const key: IResourceManagerParams = { projectId, folder };

    await this.load(key);
    await this.performUpdate(key, undefined, async () => {
      const { resources } = await this.graphQLService.sdk.getResourceList({
        projectId,
        folder,
        nameMask,
        readProperties: true,
      });

      const currentResources = this.get(key);
      const resource = this.getResource(key, resourcePath);

      if (resource) {
        currentResources?.splice(
          currentResources.indexOf(resource),
          1,
          ...resources.map(resource => ({ properties: {}, ...resource }))
        );
      }

      // this.dataSet(
      //   key,
      //   resources.map(resource => ({ properties: {}, ...resource }))
      // );
    }, () => {
      const resource = this.getResource(key, resourcePath);
      return resource?.properties && this.isLoaded(key) && !this.isOutdated(key);
    });

    return this.getResource(key, resourcePath)?.properties;
  }

  async setProperties(
    projectId: string,
    resourcePath: string,
    diff: Record<string, any>
  ): Promise<Record<string, any>> {
    const folder = this.getFolder(resourcePath);
    const key: IResourceManagerParams = { projectId, folder };
    const propertiesPatch: Record<string, any> = {};
    const properties = await this.loadProperties(projectId, resourcePath);

    await this.performUpdate(key, undefined, async () => {
      for (const [name, value] of Object.entries(diff)) {
        if (
          properties[name] === value
        || (value === null && !(value in properties))
        ) {
          continue;
        }

        await this.graphQLService.sdk.setResourceProperty({
          projectId,
          resourcePath,
          name,
          value,
        });

        propertiesPatch[name] = value;
      }

      Object.assign(properties, propertiesPatch);
    });

    return properties;
  }

  async createResource(projectId: string, resourcePath: string, folder: boolean) {
    await this.graphQLService.sdk.createResource({
      projectId,
      resourcePath,
      isFolder: folder,
    });

    await this.load({ projectId, folder: folder ? resourcePath : this.getFolder(resourcePath) });
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

    const ref = this.keys.find(k => k.projectId === key.projectId && isValuesEqual(k.folder, key.folder, ''));

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

      this.dataSet(key, resources.map(({ properties, ...resource }) => resource));
    });

    return this.data;
  }
}