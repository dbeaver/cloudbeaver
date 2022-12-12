/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { DataSynchronizationService } from '@cloudbeaver/core-root';
import { CachedMapResource, CachedResourceIncludeArgs, GetResourceListQueryVariables, GraphQLService, ICachedMapResourceMetadata, isResourceKeyList, ResourceKey, resourceKeyList, ResourceKeyUtils, RmResource } from '@cloudbeaver/core-sdk';
import { createPath, isValuesEqual, MetadataMap } from '@cloudbeaver/core-utils';

import { EResourceManagerEventType, ResourceManagerEventHandler } from './ResourceManagerEventHandler';

export type ResourceInfoIncludes = Omit<GetResourceListQueryVariables, 'projectId'>;
export type RmResourceInfo = RmResource;
export interface IResourceManagerParams {
  projectId: string;
  path?: string;
  name?: string;
}

export interface IResourceManagerMoveData {
  from: IResourceManagerParams;
  to: IResourceManagerParams;
}

@injectable()
export class ResourceManagerResource
  extends CachedMapResource<IResourceManagerParams, RmResourceInfo[], ResourceInfoIncludes> {
  readonly onMove: IExecutor<IResourceManagerMoveData>;
  constructor(
    private readonly graphQLService: GraphQLService,
    resourceManagerEventHandler: ResourceManagerEventHandler,
    dataSynchronizationService: DataSynchronizationService,
  ) {
    super();

    this.onMove = new Executor();

    resourceManagerEventHandler.on<IResourceManagerParams>(
      async key => {
        let parentFolderKey = createParentResourceKey(key);
        parentFolderKey = {
          projectId: parentFolderKey.projectId,
          path: [parentFolderKey.path, parentFolderKey.name].filter(Boolean).join('/'),
          name: undefined,
        };

        if (this.isInUse({ ...key, name: undefined })) {
          dataSynchronizationService
            .requestSynchronization('resource', createPath(key.path, key.name))
            .then(async state => {
              if (state && !this.isOutdated(parentFolderKey)) {
                await this.load(key);
              }
            });
        } else {
          if (!this.isOutdated(parentFolderKey)) {
            await this.load(key);
          }
        }
      },
      data => ({
        projectId: data.projectId,
        path: this.getFolder(data.resourcePath),
        name: this.getResourceName(data.resourcePath),
      }),
      d => d.status === EResourceManagerEventType.TypeCreate);

    resourceManagerEventHandler.on<IResourceManagerParams>(
      key => {
        if (this.isInUse(key)) {
          dataSynchronizationService
            .requestSynchronization('resource', createPath(key.path, key.name))
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
      data => ({
        projectId: data.projectId,
        path: this.getFolder(data.resourcePath),
        name: this.getResourceName(data.resourcePath),
      }),
      d => d.status === EResourceManagerEventType.TypeUpdate);

    resourceManagerEventHandler.on<IResourceManagerParams>(
      key => {
        if (this.isInUse(key)) {
          dataSynchronizationService
            .requestSynchronization('resource', createPath(key.path, key.name))
            .then(state => {
              if (state) {
                this.delete(key);
                this.onDataUpdate.execute({ ...key, name: undefined });
              }
            });
        } else {
          this.delete(key);
          this.onDataUpdate.execute({ ...key, name: undefined });
        }
      },
      data => ({
        projectId: data.projectId,
        path: this.getFolder(data.resourcePath),
        name: this.getResourceName(data.resourcePath),
      }),
      d => d.status === EResourceManagerEventType.TypeDelete);
  }

  getResourceName(resourcePath: string): string {
    const parts = resourcePath.split('/');
    return parts[parts.length - 1];
  }

  getFolder(resourcePath: string): string {
    const parts = resourcePath.split('/');
    return parts.slice(0, parts.length - 1).join('/');
  }

  getResource(key: IResourceManagerParams, resourcePath: string): RmResourceInfo | undefined {
    const resources = this.get(key);
    const name = this.getResourceName(resourcePath);

    return resources?.find(resource => resource.name === name);
  }

  async move(from: IResourceManagerParams, to: IResourceManagerParams): Promise<void> {
    await this.performUpdate(from, undefined, async () => {
      await this.graphQLService.sdk.moveResource({
        projectId: from.projectId,
        newPath: createPath(to.path, to.name),
        oldPath: createPath(from.path, from.name),
      });

      await this.onMove.execute({ from, to });
      this.delete(from);
    });

    await this.load(to);
  }

  async setProperties(
    key: IResourceManagerParams,
    diff: Record<string, any>
  ): Promise<Record<string, any>> {
    const propertiesPatch: Record<string, any> = {};
    const elements = await this.load(key, ['includeProperties']);
    const properties = elements[0].properties;

    await this.performUpdate(key, undefined, async () => {
      for (const [name, value] of Object.entries(diff)) {
        if (
          properties[name] === value
        || (value === null && !(name in properties))
        ) {
          continue;
        }

        await this.graphQLService.sdk.setResourceProperty({
          projectId: key.projectId,
          resourcePath: createPath(key.path, key.name),
          name,
          value,
        });

        propertiesPatch[name] = value;
      }

      Object.assign(properties, propertiesPatch);
    });

    return properties;
  }

  async create(key: IResourceManagerParams, folder: boolean) {
    await this.graphQLService.sdk.createResource({
      projectId: key.projectId,
      resourcePath: createPath(key.path, key.name),
      isFolder: folder,
    });

    await this.load(key);
  }

  async writeText(key: IResourceManagerParams, data: string, forceOverwrite: boolean) {
    await this.graphQLService.sdk.writeResourceContent({
      projectId: key.projectId,
      resourcePath: createPath(key.path, key.name),
      data,
      forceOverwrite,
    });

    this.markOutdated(key);
    await this.load(key);
  }

  async readText(key: IResourceManagerParams) {
    await this.load(key);

    const result = await this.graphQLService.sdk.readResource({
      projectId: key.projectId,
      resourcePath: createPath(key.path, key.name),
    });

    return result.value;
  }

  async deleteResource(key: IResourceManagerParams) {
    await this.performUpdate(key, undefined, async () => {
      await this.graphQLService.sdk.deleteResource({
        projectId: key.projectId,
        resourcePath: createPath(key.path, key.name),
        recursive: false,
      });

      this.delete(key);
    });
  }

  protected async preLoadData(
    key: ResourceKey<IResourceManagerParams>,
    refresh: boolean,
    includes: CachedResourceIncludeArgs<RmResourceInfo, ResourceInfoIncludes>
  ): Promise<void> {
    if (ResourceKeyUtils.some(key, key => !!key.name)) {
      key = ResourceKeyUtils.map(key, key => ({ ...key, name: undefined }));

      if (refresh) {
        await this.refresh(key);
      } else {
        await this.load(key);
      }
    }
  }

  protected async loader(
    key: ResourceKey<IResourceManagerParams>,
    includes: CachedResourceIncludeArgs<RmResourceInfo, ResourceInfoIncludes>
  ): Promise<Map<IResourceManagerParams, RmResourceInfo[]>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { projectId, path, name } = key;
      const parentKey = { projectId, path };

      if (!this.has(parentKey) || !name) {
        const { resources } = await this.graphQLService.sdk.getResourceList({
          projectId,
          path,
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(parentKey, includes),
        });
        this.set(parentKey, resources);
      } else {
        const { resources } = await this.graphQLService.sdk.getResourceList({
          projectId,
          path,
          nameMask: name,
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(key, includes),
        });

        if (name && resources.length === 0) {
          throw new Error(`Resource ${createPath(projectId, path, name)} not found`);
        }
        this.set(key, resources);
      }
    });

    return this.data;
  }

  getKeyRef(key: IResourceManagerParams): IResourceManagerParams {
    if (this.keys.includes(key)) {
      return key;
    }

    const ref = this.keys.find(k => isResourceManagerParamEqual(k, key));

    if (ref) {
      return ref;
    }

    return { projectId: key.projectId, path: key.path };
  }

  getMetadataKeyRef(key: IResourceManagerParams): IResourceManagerParams {
    const keys = Array.from(this.metadata.keys());
    if (keys.includes(key)) {
      return key;
    }

    const ref = keys.find(k => isResourceManagerParamEqual(k, key, true));

    if (ref) {
      return ref;
    }

    return key;
  }

  isKeyEqual(param: IResourceManagerParams, second: IResourceManagerParams): boolean {
    return isResourceManagerParamEqual(param, second, true);
  }

  delete(key: ResourceKey<IResourceManagerParams>): void {
    key = this.transformParam(key);
    const items = this.getNestedChildren(key);

    if (items.length === 0) {
      return;
    }

    key = resourceKeyList(items);

    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(key);
    });
  }

  updateMetadata(key: IResourceManagerParams, callback: (data: ICachedMapResourceMetadata) => void): void {
    const folderMetadata = this.getMetadata(key);
    callback(folderMetadata);

    if (!key.name) {
      const elements = this.dataGet(key);

      if (elements) {
        const keys = elements.map(e => createChildResourceKey(key, e.name));

        for (const key of keys) {
          const metadata = this.getMetadata(key);
          callback(metadata);
        }
      }
    }
  }

  dataUpdate(key: ResourceKey<IResourceManagerParams>): void {
    this.onDataUpdate.execute(resourceKeyList(this.getNestedChildren(key)));
  }

  protected commitIncludes(key: ResourceKey<IResourceManagerParams>, includes: string[]): void {
    key = this.transformParam(key);
    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, parentMetadata => {
        for (const include of includes) {
          if (!parentMetadata.includes.includes(include)) {
            parentMetadata.includes.push(include);
          }
        }

        if (!key.name) {
          const elements = this.dataGet(key);

          if (elements) {
            const keys = elements.map(e => createChildResourceKey(key, e.name));

            for (const key of keys) {
              this.updateMetadata(key, metadata => {
                metadata.includes = toJS(parentMetadata.includes);
              });
            }
          }
        }
      });
    });
  }

  protected populateMetadata(
    key: IResourceManagerParams,
    metadata: MetadataMap<IResourceManagerParams, ICachedMapResourceMetadata>
  ): Record<string, any> {
    if (key.name) {
      return {
        ...toJS(this.getMetadata({ ...key, name: undefined })),
        dependencies: observable([]),
        outdated: true, // trigger infinity update because of
        loading: false,
        exception: null,
      };
    }
    return {};
  }

  getNestedChildren(key: ResourceKey<IResourceManagerParams>): IResourceManagerParams[] {
    const nestedChildren: IResourceManagerParams[] = [];
    let prevChildren: IResourceManagerParams[];

    if (isResourceKeyList(key)) {
      prevChildren = key.list.concat();
    } else {
      prevChildren = [
        key,
        ...(
          this.dataGet(createChildResourceKey(key, ''))?.map(e => createChildResourceKey(key, e.name))
          || []
        ),
      ];
    }

    nestedChildren.push(...prevChildren);

    while (prevChildren.length) {
      const key = prevChildren.shift()!;
      const children = (
        this.dataGet(createChildResourceKey(key, ''))?.map(e => createChildResourceKey(key, e.name))
        || []
      );
      prevChildren.push(...children);
      nestedChildren.push(...children);
    }

    return nestedChildren;
  }

  protected getLockedKeys(key: ResourceKey<IResourceManagerParams>): ResourceKey<IResourceManagerParams> {
    return getResourceManagerParamParents(key);
  }

  protected dataGet(key: IResourceManagerParams): RmResourceInfo[] | undefined {
    const name = key.name;
    key = this.getKeyRef(key);
    const elements = this.data.get(key)
      ?.filter(r => name === undefined || r.name === name);
    return elements;
  }

  protected dataSet(key: IResourceManagerParams, value: RmResourceInfo[]): void {
    const name = key.name;
    key = this.getKeyRef(key);
    const currentValue = this.data.get(key) || [];
    const deleted = name
      ? []
      : currentValue.filter(r => !value.some(v => v.name === r.name));

    this.delete(resourceKeyList(deleted.map(r => ({ ...key, name: r.name }))));

    if (name) {
      this.data.set(
        key,
        [
          ...currentValue.filter(r => !value.some(v => v.name === r.name)),
          ...value,
        ]
      );
    } else {
      this.data.set(key, value);
    }
  }

  protected dataDelete(key: IResourceManagerParams): void {
    const name = key.name;
    key = this.getKeyRef(key);

    if (!name) {
      this.data.delete(key);
    } else {
      const currentValue = this.data.get(key);

      if (currentValue) {
        this.data.set(key, currentValue.filter(v => v.name !== name));
      }
    }
  }

  protected dataHas(key: IResourceManagerParams): boolean {
    const name = key.name;
    key = this.getKeyRef(key);
    const currentValue = this.data.get(key);

    if (!currentValue) {
      return false;
    }

    return name ? currentValue.some(v => v.name === name) : true;
  }

  private getDefaultIncludes(): ResourceInfoIncludes {
    return {
      includeProperties: false,
    };
  }
}

export function createParentResourceKey(key: IResourceManagerParams): IResourceManagerParams {
  const path = key.path?.split('/');

  return {
    projectId: key.projectId,
    path: path?.slice(0, path.length - 1).join('/'),
    name: path?.[path.length - 1],
  };
}

export function createChildResourceKey(key: IResourceManagerParams, name: string): IResourceManagerParams {
  return {
    projectId: key.projectId,
    path: createPath(key.path, key.name),
    name,
  };
}

export function isResourceManagerParamEqual(
  param: IResourceManagerParams,
  second: IResourceManagerParams,
  strict?: boolean
): boolean {
  return (
    param.projectId === second.projectId
    && isValuesEqual(param.path, second.path, '')
    && (!strict || isValuesEqual(param.name, second.name, ''))
  );
}

export function getResourceManagerParamParents(
  key: ResourceKey<IResourceManagerParams>
): ResourceKey<IResourceManagerParams> {
  const nestedChildren: IResourceManagerParams[] = [];
  let prevChildren: IResourceManagerParams[];

  if (isResourceKeyList(key)) {
    prevChildren = key.list.concat();
  } else {
    prevChildren = [key];
  }

  nestedChildren.push(...prevChildren);

  for (const key of prevChildren) {
    const path = key.path?.split('/') || [];

    const children = path.map<IResourceManagerParams>((name, i, array) => ({
      projectId: key.projectId,
      path: array.slice(0, i).join('/'),
      name,
    }));

    nestedChildren.push(...children);
  }

  return resourceKeyList(nestedChildren);
}