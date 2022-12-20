/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { SharedProjectsResource } from '@cloudbeaver/core-resource-manager';
import { EPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, ProjectInfo as SchemaProjectInfo, CachedMapResource, CachedMapAllKey, ResourceKey, ResourceKeyUtils, resourceKeyList } from '@cloudbeaver/core-sdk';

export type ProjectInfo = SchemaProjectInfo;

@injectable()
export class ProjectInfoResource extends CachedMapResource<string, ProjectInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sharedProjectsResource: SharedProjectsResource,
    private readonly userInfoResource: UserInfoResource,
    sessionPermissionsResource: SessionPermissionsResource
  ) {
    super(new Map(), []);

    this.sync(this.userInfoResource);
    sessionPermissionsResource.require(this, EPermission.public);
    this.sharedProjectsResource.onDataOutdated.addHandler(this.markOutdated.bind(this));
    this.sharedProjectsResource.onItemAdd.addHandler(() => this.markOutdated());
    this.sharedProjectsResource.onItemDelete.addHandler(() => this.markOutdated());
    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
  }

  getUserProject(userId: string): ProjectInfo | undefined {
    return this.get(`u_${userId}`);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, ProjectInfo>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);

    const { projects } = await this.graphQLService.sdk.getProjectList();

    runInAction(() => {
      if (all) {
        this.delete(resourceKeyList(this.keys.filter(id => !projects.some(project => project.id === id))));
      }

      this.set(resourceKeyList(projects.map(project => project.id)), projects);
    });

    return this.data;
  }
}

export function projectInfoSortByName(a: ProjectInfo, b: ProjectInfo) {
  if (a.id === b.id) {
    return 0;
  }

  if (a.global !== b.global) {
    return +a.global - +b.global;
  }

  if (a.shared !== b.shared) {
    return +a.shared - +b.shared;
  }

  return a.name.localeCompare(b.name);
}
