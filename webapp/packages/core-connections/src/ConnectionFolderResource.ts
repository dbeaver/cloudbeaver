/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { EPermission, SessionPermissionsResource, SessionDataResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  resourceKeyList,
  ResourceKey,
  ResourceKeyUtils,
  CachedMapAllKey,
  ConnectionFolderInfoFragment,
  isResourceKeyList,
  ResourceKeyList,
} from '@cloudbeaver/core-sdk';

export type ConnectionFolder = ConnectionFolderInfoFragment;

export interface IConnectionFolderParam {
  projectId: string;
  folderId: string;
}

export const CONNECTION_FOLDER_NAME_VALIDATION = /^(?!\.)[\p{L}\w\-$.\s()@]+$/u;

const connectionFolderProjectKeySymbol = Symbol('@connection-folder/project') as unknown as IConnectionFolderParam;
export const ConnectionFolderProjectKey = (projectId: string) => resourceKeyList<IConnectionFolderParam>(
  [connectionFolderProjectKeySymbol],
  projectId
);

@injectable()
export class ConnectionFolderResource extends CachedMapResource<IConnectionFolderParam, ConnectionFolder> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource
  ) {
    super();

    permissionsResource.require(this, EPermission.public);
    sessionDataResource.outdateResource(this);

    this.addAlias(
      isConnectionFolderProjectKey,
      param => resourceKeyList(this.keys.filter(key => key.projectId === param.mark)),
      true
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

  toNodeId(key: IConnectionFolderParam): string {
    return `folder://${key.projectId}/${key.folderId}`;
  }

  protected async loader(
    originalKey: ResourceKey<IConnectionFolderParam>
  ): Promise<Map<IConnectionFolderParam, ConnectionFolder>> {
    let projectId: string | undefined;
    const all = ResourceKeyUtils.includes(originalKey, CachedMapAllKey);
    const isProjectFolders = isConnectionFolderProjectKey(originalKey);
    const key = this.transformParam(originalKey);

    if (isProjectFolders) {
      projectId = (originalKey as ResourceKeyList<IConnectionFolderParam>).mark;
    }

    await ResourceKeyUtils.forEachAsync(
      (all || isProjectFolders) ? CachedMapAllKey : key,
      async (key: IConnectionFolderParam) => {
        let folderId: string | undefined;

        if (!all && !isProjectFolders) {
          folderId = key.folderId;
          projectId = key.projectId;
        }

        const { folders } = await this.graphQLService.sdk.getConnectionFolders({
          projectId,
          path: folderId,
        });

        runInAction(() => {
          if (all) {
            this.resetIncludes();
            this.clear();
          }

          if (isProjectFolders) {
            const removedFolders = this.keys
              .filter(key => !folders.some(f => (
                key.projectId === projectId
                && key.folderId === f.id
              )));

            this.delete(resourceKeyList(removedFolders));
          }

          this.set(
            resourceKeyList(folders.map<IConnectionFolderParam>(folder => createConnectionFolderParam(
              folder.projectId,
              folder.id,
            ))),
            folders
          );
        });
      });

    return this.data;
  }

  isKeyEqual(param: IConnectionFolderParam, second: IConnectionFolderParam): boolean {
    return (
      param.projectId.localeCompare(second.projectId, undefined, { sensitivity: 'accent' }) === 0
      && param.folderId.localeCompare(second.folderId, undefined, { sensitivity: 'accent' }) === 0
    );
  }

  getKeyRef(key: IConnectionFolderParam): IConnectionFolderParam {
    if (this.keys.includes(key)) {
      return key;
    }

    const ref = this.keys.find(k => this.isKeyEqual(k, key));

    if (ref) {
      return ref;
    }

    return key;
  }
}

function isConnectionFolderProjectKey(
  param: ResourceKey<IConnectionFolderParam>
): param is ResourceKeyList<IConnectionFolderParam> {
  return isResourceKeyList(param) && param.list.includes(connectionFolderProjectKeySymbol);
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
