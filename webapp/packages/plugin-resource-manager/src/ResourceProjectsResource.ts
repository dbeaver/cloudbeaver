/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource, RmProject } from '@cloudbeaver/core-sdk';

export type Project = Omit<RmProject, 'creator' | 'createTime' | 'canEditConnection' | 'canEditResource'>;

@injectable()
export class ResourceProjectsResource extends CachedDataResource<Project[]> {
  get userProject(): Project | undefined {
    return this.data.filter(project => !project.shared)[0];
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super([]);

    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.loaded = false;
      this.markOutdated();
    });

    makeObservable(this, {
      userProject: computed,
    });
  }

  protected async loader(): Promise<Project[]> {
    const { projects } = await this.graphQLService.sdk.getResourceProjectList();
    return projects;
  }
}