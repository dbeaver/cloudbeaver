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
import { GraphQLService, ProjectInfo, CachedMapResource, CachedMapAllKey, ResourceKey, ResourceKeyUtils, resourceKeyList } from '@cloudbeaver/core-sdk';

export type Project = ProjectInfo;

@injectable()
export class ProjectsResource extends CachedMapResource<string, Project> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super([]);

    this.sync(this.userInfoResource);
    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, Project>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);

    const { projects } = await this.graphQLService.sdk.getProjectList();

    runInAction(() => {
      if (all) {
        this.data.clear();
      }

      this.set(resourceKeyList(projects.map(project => project.id)), projects);
    });

    return this.data;
  }
}