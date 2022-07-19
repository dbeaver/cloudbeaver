/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

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
} from '@cloudbeaver/core-sdk';

export type ConnectionFolder = ConnectionFolderInfoFragment;

const baseProject = 'user';
export const CONNECTION_FOLDER_NAME_VALIDATION = /^(?!\.)[\p{L}\w\-$.\s()@]+$/u;

@injectable()
export class ConnectionFolderResource extends CachedMapResource<string, ConnectionFolder[]> {
  static baseProject = baseProject;
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource
  ) {
    super();

    permissionsResource.require(this, EPermission.public);
    sessionDataResource.outdateResource(this);

    makeObservable<this>(this, {
      add: action,
      remove: action,
      create: action,
    });
  }

  getFolder(projectId: string, folderId: string): ConnectionFolder | undefined {
    return this.get(projectId.toLowerCase())?.find(folder => folder.id.toLowerCase() === folderId.toLowerCase());
  }

  add(...newFolders: ConnectionFolder[]): void {
    const projectId = baseProject.toLowerCase();
    if (!this.has(projectId)) {
      this.set(projectId, []);
    }

    const folders = this.get(projectId)!;

    for (const folder of newFolders) {
      const folderIndex = folders.findIndex(f => f.id.toLowerCase() === folder.id.toLowerCase());

      if (folderIndex !== -1) {
        folders.splice(folderIndex, 1, folder);
      } else {
        folders.push(folder);
      }
    }
    this.set(projectId, folders);
  }

  remove(projectId: string, folderId: string): void {
    projectId = projectId.toLowerCase();

    const folders = this.get(projectId);

    if (folders) {
      const folderIndex = folders.findIndex(f => f.id.toLowerCase() === folderId.toLowerCase());

      if (folderIndex !== -1) {
        folders.splice(folderIndex, 1);
      }
      this.set(projectId, folders);
    }
  }

  async create(folderName: string, parentId?: string): Promise<ConnectionFolder> {
    const { folder } = await this.graphQLService.sdk.createConnectionFolder({
      parentFolderPath: parentId,
      folderName,
    });

    this.add(folder);

    return this.getFolder(baseProject, folderName)!;
  }

  async deleteFolder(projectId: string, folderPath: string): Promise<void> {
    await this.performUpdate(projectId.toLowerCase(), [], async () => {
      await this.graphQLService.sdk.deleteConnectionFolder({ folderPath });
      this.remove(projectId, folderPath);
    });
  }

  fromNodeId(nodeId: string): ConnectionFolder | undefined {
    const data = /^folder:\/\/(.*?)\/(.*)$/ig.exec(nodeId);

    if (data) {
      const [t, projectId, folderId] = data;

      return this.getFolder(baseProject/*projectId*/, folderId);
    }

    return undefined;
  }

  toNodeId(projectId: string, folderId: string): string {
    return `folder://${projectId}/${folderId}`;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, ConnectionFolder[]>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const project = all ? undefined : key;

      const { folders } = await this.graphQLService.sdk.getConnectionFolders({
        project,
      });

      if (all) {
        this.resetIncludes();

        const projects = Array.from(new Set(folders.map(folder => baseProject/*folder.project*/)));

        const unrestoredProjects = Array.from(this.data.keys())
          .filter(projectId => !projects.includes(projectId));

        this.delete(resourceKeyList(unrestoredProjects));
      }

      this.set(baseProject, []);
      this.add(...folders);
    });

    return this.data;
  }
}
