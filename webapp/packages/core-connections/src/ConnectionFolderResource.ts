/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import {
  CachedMapAllKey,
  CachedMapResource,
  isResourceAlias,
  type ResourceKey,
  resourceKeyAliasFactory,
  resourceKeyList,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { type ConnectionFolderInfoFragment, GraphQLService } from '@cloudbeaver/core-sdk';

import { createConnectionFolderParam } from './createConnectionFolderParam.js';
import { getConnectionFolderIdFromNodeId } from './NavTree/getConnectionFolderIdFromNodeId.js';

export type ConnectionFolder = ConnectionFolderInfoFragment;

export interface IConnectionFolderParam {
  projectId: string;
  folderId: string;
}

export const CONNECTION_FOLDER_NAME_VALIDATION = /^(?!\.)[^\\/:\\"'<>|?*]+$/u;

export const ConnectionFolderProjectKey = resourceKeyAliasFactory('@connection-folder/project', (projectId: string) => ({ projectId }));

export class ConnectionFolderResourceImpl extends CachedMapResource<IConnectionFolderParam, ConnectionFolder> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    sessionDataResource: SessionDataResource,
    appAuthService: AppAuthService,
  ) {
    super();

    appAuthService.requireAuthentication(this);
    sessionDataResource.outdateResource(this);

    this.aliases.add(ConnectionFolderProjectKey, param => resourceKeyList(this.keys.filter(key => key.projectId === param.options.projectId)));

    makeObservable<this>(this, {
      create: action,
    });
  }

  async create(projectId: string, name: string, parentId?: string): Promise<ConnectionFolder> {
    const { folder } = await this.graphQLService.sdk.createConnectionFolder({
      projectId,
      folderName: name,
      parentFolderPath: parentId,
    });

    const key = createConnectionFolderParam(projectId, folder.id);
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
      this.onDataOutdated.execute(key);
    });
  }

  fromNodeId(nodeId: string): ConnectionFolder | undefined {
    const node = this.navNodeInfoResource.get(nodeId);

    if (!node) {
      return;
    }

    const key = getConnectionFolderIdFromNodeId(node);

    if (key) {
      return this.get(key);
    }

    return undefined;
  }

  protected async loader(originalKey: ResourceKey<IConnectionFolderParam>): Promise<Map<IConnectionFolderParam, ConnectionFolder>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const projectFoldersKey = this.aliases.isAlias(originalKey, ConnectionFolderProjectKey);
    const folderList: ConnectionFolder[] = [];
    let projectId: string | undefined;
    let folderId: string | undefined;

    if (projectFoldersKey) {
      projectId = projectFoldersKey.options.projectId;
    }

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      if (!isResourceAlias(key)) {
        folderId = key.folderId;
        projectId = key.projectId;
      }

      const { folders } = await this.graphQLService.sdk.getConnectionFolders({
        projectId,
        path: folderId,
      });

      folderList.push(...folders);
    });

    const key = resourceKeyList(folderList.map<IConnectionFolderParam>(folder => createConnectionFolderParam(folder.projectId, folder.id)));

    runInAction(() => {
      if (all) {
        this.replace(key, folderList);
      } else {
        if (projectFoldersKey) {
          const removedFolders = this.keys.filter(key => !folderList.some(f => key.projectId === projectId && key.folderId === f.id));

          this.delete(resourceKeyList(removedFolders));
        }

        this.set(key, folderList);
      }
    });

    return this.data;
  }

  override isKeyEqual(param: IConnectionFolderParam, second: IConnectionFolderParam): boolean {
    return param.projectId === second.projectId && param.folderId === second.folderId;
  }

  protected validateKey(key: IConnectionFolderParam): boolean {
    return typeof key === 'object' && typeof key.projectId === 'string' && ['string'].includes(typeof key.folderId);
  }
}

export type ConnectionFolderResource = ConnectionFolderResourceImpl;

export class ConnectionFolderResourceDI extends Context.Service<ConnectionFolderResourceDI, ConnectionFolderResourceImpl>()(
  '@cloudbeaver/core-connections/ConnectionFolderResource#ConnectionFolderResource',
) {
  static readonly implementation = ConnectionFolderResourceImpl;

  static readonly dependencies = () => [GraphQLService, NavNodeInfoResource, SessionDataResource, AppAuthService] as const;
  static readonly make: Effect.Effect<
    ConnectionFolderResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof NavNodeInfoResource>
    | Context.Service.Identifier<typeof SessionDataResource>
    | Context.Service.Identifier<typeof AppAuthService>
  > = Effect.gen(function* makeConnectionFolderResource() {
    const graphQLService = yield* GraphQLService;
    const navNodeInfoResource = yield* NavNodeInfoResource;
    const sessionDataResource = yield* SessionDataResource;
    const appAuthService = yield* AppAuthService;

    return new ConnectionFolderResourceImpl(graphQLService, navNodeInfoResource, sessionDataResource, appAuthService);
  });
  static readonly layer: Layer.Layer<
    ConnectionFolderResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof NavNodeInfoResource>
    | Context.Service.Identifier<typeof SessionDataResource>
    | Context.Service.Identifier<typeof AppAuthService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionFolderResource = ConnectionFolderResourceDI;
