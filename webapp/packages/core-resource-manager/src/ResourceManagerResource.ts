/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { DataSynchronizationService, ServerEventId } from '@cloudbeaver/core-root';
import { CachedResourceIncludeArgs, CachedTreeChildrenKey, CachedTreeResource, DetailsError, GetResourceListQueryVariables, GraphQLService, ResourceKey, resourceKeyList, ResourceKeyUtils, RmResource } from '@cloudbeaver/core-sdk';
import { createPath, getPathParent, getPathParts } from '@cloudbeaver/core-utils';

import { ResourceManagerEventHandler } from './ResourceManagerEventHandler';

export type ResourceInfoIncludes = Omit<GetResourceListQueryVariables, 'projectId'>;
export type RmResourceInfo = RmResource;

export interface IResourceManagerMoveData {
  from: string;
  to: string;
}

@injectable()
export class ResourceManagerResource extends CachedTreeResource<RmResourceInfo, ResourceInfoIncludes> {
  readonly onMove: IExecutor<IResourceManagerMoveData>;
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly projectsService: ProjectsService,
    resourceManagerEventHandler: ResourceManagerEventHandler,
    dataSynchronizationService: DataSynchronizationService,
  ) {
    super();

    this.onMove = new Executor();

    this.projectsService.onActiveProjectChange.addHandler(data => {
      if (data.type === 'after') {
        this.markOutdated(resourceKeyList(data.projects));
      }
    });

    resourceManagerEventHandler.onEvent<string>(
      ServerEventId.CbRmResourceCreated,
      async key => {
        const parent = getPathParent(key);

        if (this.isInUse(key)) {
          dataSynchronizationService
            .requestSynchronization('resource', key)
            .then(async state => {
              if (state && !this.isOutdated(parent)) {
                await this.load(key);
              }
            });
        } else {
          if (!this.isOutdated(parent)) {
            await this.load(key);
          }
        }
      },
      data => getRmResourcePath(data.projectId, data.resourcePath),
      this
    );

    resourceManagerEventHandler.onEvent<string>(
      ServerEventId.CbRmResourceUpdated,
      key => {
        if (this.isInUse(key)) {
          dataSynchronizationService
            .requestSynchronization('resource', key)
            .then(state => {
              if (state) {
                this.onDataUpdate.execute(key);
                this.markOutdated(key);
              }
            });
        } else {
          this.onDataUpdate.execute(key);
          this.markOutdated(key);
        }
      },
      data => getRmResourcePath(data.projectId, data.resourcePath),
      this
    );

    resourceManagerEventHandler.onEvent<string>(
      ServerEventId.CbRmResourceDeleted,
      key => {
        if (this.isInUse(key)) {
          dataSynchronizationService
            .requestSynchronization('resource', key)
            .then(state => {
              if (state) {
                this.delete(key);
                this.onDataUpdate.execute(key);
              }
            });
        } else {
          this.delete(key);
          this.onDataUpdate.execute(key);
        }
      },
      data => getRmResourcePath(data.projectId, data.resourcePath),
      this
    );
  }

  async move(from: string, to: string): Promise<void> {
    const fromResourceKey = getRmResourceKey(from);
    const toResourceKey = getRmResourceKey(to);
    await this.performUpdate(from, undefined, async () => {
      await this.graphQLService.sdk.moveResource({
        projectId: fromResourceKey.projectId,
        oldPath: fromResourceKey.path,
        newPath: toResourceKey.path,
      });

      await this.onMove.execute({ from, to });
      this.delete(from);
    });

    await this.load(to);
  }

  async setProperties(
    key: string,
    diff: Record<string, any>
  ): Promise<Record<string, any>> {
    const propertiesPatch: Record<string, any> = {};
    const elements = await this.load(key, ['includeProperties']);
    const properties = elements.properties;
    const resourceKey = getRmResourceKey(key);

    await this.performUpdate(key, undefined, async () => {
      for (const [name, value] of Object.entries(diff)) {
        if (
          properties[name] === value
        || (value === null && !(name in properties))
        ) {
          continue;
        }

        await this.graphQLService.sdk.setResourceProperty({
          projectId: resourceKey.projectId,
          resourcePath: resourceKey.path,
          name,
          value,
        });

        propertiesPatch[name] = value;
      }

      Object.assign(properties, propertiesPatch);
    });

    return properties;
  }

  async create(key: string, folder: boolean) {
    const resourceKey = getRmResourceKey(key);
    await this.graphQLService.sdk.createResource({
      projectId: resourceKey.projectId,
      resourcePath: resourceKey.path,
      isFolder: folder,
    });

    await this.load(key);
  }

  async writeText(key: string, data: string, forceOverwrite: boolean) {
    const resourceKey = getRmResourceKey(key);
    await this.graphQLService.sdk.writeResourceContent({
      projectId: resourceKey.projectId,
      resourcePath: resourceKey.path,
      data,
      forceOverwrite,
    });

    this.markOutdated(key);
    await this.load(key);
  }

  async readText(key: string) {
    await this.load(key);

    const resourceKey = getRmResourceKey(key);
    const result = await this.graphQLService.sdk.readResource({
      projectId: resourceKey.projectId,
      resourcePath: resourceKey.path,
    });

    return result.value;
  }

  async deleteResource(path: string) {
    await this.performUpdate(path, undefined, async () => {
      const resourceKey = getRmResourceKey(path);
      await this.graphQLService.sdk.deleteResource({
        projectId: resourceKey.projectId,
        resourcePath: resourceKey.path,
        recursive: false,
      });

      this.delete(path);
    });
  }

  protected async loader(
    key: ResourceKey<string>,
    includes: CachedResourceIncludeArgs<RmResourceInfo, ResourceInfoIncludes>
  ) {
    const resourcesList = new Map<string, RmResourceInfo>();

    await ResourceKeyUtils.forEachAsync(key, async key => {
      if (this.isAlias(key, CachedTreeChildrenKey)) {
        const resourceKey = getRmResourceKey(key.options.path);

        const { resources } = await this.graphQLService.sdk.getResourceList({
          projectId: resourceKey.projectId,
          path: resourceKey.path,
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(key.options.path, includes),
        });

        for (const resource of resources) {
          resourcesList.set(createPath(key.options.path, resource.name), resource);
        }

        const parent = getPathParent(key.options.path);
        if (parent) {
          key = parent;
        }
      }

      if (!this.isAlias(key)) {
        const resourceKey = getRmResourceKey(key);
        const { resources } = await this.graphQLService.sdk.getResourceList({
          projectId: resourceKey.projectId,
          path: resourceKey.parent,
          nameMask: resourceKey.name,
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(key, includes),
        });

        if (resourceKey.name && resources.length === 0) {
          throw new DetailsError(`Resource "${key}" not found`);
        }

        resourcesList.set(key, resources[0]);
      }

    });

    this.set(resourceKeyList([...resourcesList.keys()]), [...resourcesList.values()]);

    return this.data;
  }

  private getDefaultIncludes(): ResourceInfoIncludes {
    return {
      includeProperties: false,
    };
  }
}

export function getRmResourcePath(projectId: string, path?: string): string {
  return createPath(projectId, path);
}

interface IRmResourceKey {
  path: string;
  projectId: string;
  parent: string;
  name?: string;
}

export function getRmResourceKey(path: string): IRmResourceKey {
  const parts = getPathParts(path);
  const projectId = parts[0];
  const name = parts.length > 1 ? parts[parts.length - 1] : undefined;

  return {
    path: createPath(...parts.slice(1, parts.length)),
    projectId,
    parent: createPath(...parts.slice(1, parts.length - 1)),
    name,
  };
}
