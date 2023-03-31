/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedMapResource, resourceKeyList, ResourceKeyUtils, CachedMapAllKey, ConnectionFolderInfoFragment, isResourceKeyList, isResourceKeyAlias, resourceKeyAliasFactory, ResourceKey, isResourceAlias } from '@cloudbeaver/core-sdk';

export type ConnectionFolder = ConnectionFolderInfoFragment;

export interface IConnectionFolderParam {
  projectId: string;
  folderId: string;
}

export const CONNECTION_FOLDER_NAME_VALIDATION = /^(?!\.)[\p{L}\w\-$.\s()@]+$/u;

export const ConnectionFolderProjectKey = resourceKeyAliasFactory(
  '@connection-folder/project',
  (projectId: string) => ({ projectId })
);

@injectable()
export class ConnectionFolderResource extends CachedMapResource<IConnectionFolderParam, ConnectionFolder> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
    appAuthService: AppAuthService
  ) {
    super();

    appAuthService.requireAuthentication(this);
    sessionDataResource.outdateResource(this);

    this.addAlias(
      ConnectionFolderProjectKey,
      param => resourceKeyList(this.keys.filter(key => key.projectId === param.options.projectId)),
    );

    makeObservable<this>(this, {
      create: action,
    });
  }

  async create(key: IConnectionFolderParam, parentId?: string): Promise<ConnectionFolder> {
    const { folder } = await this.graphQLService.sdk.createConnectionFolder({
      projectId: key.projectId,
      folderName: key.folderId,
      parentFolderPath: parentId,
    });

    this.set(key, { ...folder, projectId: key.projectId });

    return this.get(key)!;
  }

  async deleteFolder(key: IConnectionFolderParam): Promise<void> {
    await this.performUpdate(key, [], async () => {
      await this.graphQLService.sdk.deleteConnectionFolder({
        projectId: key.projectId,
        folderPath: key.folderId,
      });
      this.delete(key);
    });
  }

  fromNodeId(nodeId: string): ConnectionFolder | undefined {
    const data = /^folder:\/\/(.*?)\/(.*)$/ig.exec(nodeId);

    if (data) {
      const [t, projectId, folderId] = data;

      return this.get(createConnectionFolderParam(projectId, folderId));
    }

    return undefined;
  }

  protected async loader(
    originalKey: ResourceKey<IConnectionFolderParam>
  ): Promise<Map<IConnectionFolderParam, ConnectionFolder>> {
    const all = this.isAlias(originalKey, CachedMapAllKey);
    const isProjectFolders = this.isAlias(originalKey, ConnectionFolderProjectKey);
    const folders: ConnectionFolder[] = [];
    let projectId: string | undefined;
    let folderId: string | undefined;

    if (isProjectFolders) {
      projectId = originalKey.options.projectId;
    }

    await ResourceKeyUtils.forEachAsync(
      originalKey,
      async key => {
        if (!isResourceAlias(key)) {
          folderId = key.folderId;
          projectId = key.projectId;
        }

        const { folders } = await this.graphQLService.sdk.getConnectionFolders({
          projectId,
          path: folderId,
        });
        folders.push(...folders);
      });

    const key = resourceKeyList(folders.map<IConnectionFolderParam>(folder => createConnectionFolderParam(
      folder.projectId,
      folder.id,
    )));

    runInAction(() => {
      if (all) {
        this.replace(key, folders);
      } else {
        if (isProjectFolders) {
          const removedFolders = this.keys
            .filter(key => !folders.some(f => (
              key.projectId === projectId
                && key.folderId === f.id
            )));

          this.delete(resourceKeyList(removedFolders));
        }

        this.set(key,  folders);
      }
    });

    return this.data;
  }

  isKeyEqual(param: IConnectionFolderParam, second: IConnectionFolderParam): boolean {
    return (
      param.projectId === second.projectId
      && param.folderId === second.folderId
    );
  }

  protected validateKey(key: IConnectionFolderParam): boolean {
    return (
      typeof key === 'object'
      && typeof key.projectId === 'string'
      && ['string'].includes(typeof key.folderId)
    );
  }
}

export function createConnectionFolderParam(
  projectId: string,
  folder: ConnectionFolder
): IConnectionFolderParam;
export function createConnectionFolderParam(
  projectId: string,
  folderId: string
): IConnectionFolderParam;
export function createConnectionFolderParam(
  projectId: string,
  folderIdOrFolder: string | ConnectionFolder
): IConnectionFolderParam {
  if (typeof folderIdOrFolder === 'object') {
    folderIdOrFolder = folderIdOrFolder.id;
  }

  return {
    projectId: projectId,
    folderId: folderIdOrFolder,
  };
}
