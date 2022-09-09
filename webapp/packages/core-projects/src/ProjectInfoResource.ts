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
import { GraphQLService, ProjectInfo as SchemaProjectInfo, CachedMapResource, CachedMapAllKey, ResourceKey, ResourceKeyUtils, resourceKeyList } from '@cloudbeaver/core-sdk';

export type ProjectInfo = SchemaProjectInfo;

@injectable()
export class ProjectInfoResource extends CachedMapResource<string, ProjectInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sharedProjectsResource: SharedProjectsResource,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super([]);

    this.sync(this.userInfoResource);
    this.sharedProjectsResource.onDataOutdated.addHandler(this.markOutdated.bind(this));
    this.sharedProjectsResource.onItemAdd.addHandler(() => this.markOutdated());
    this.sharedProjectsResource.onItemDelete.addHandler(() => this.markOutdated());
    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
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