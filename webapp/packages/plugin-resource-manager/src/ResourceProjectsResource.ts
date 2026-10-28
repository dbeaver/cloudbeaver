/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type RmProject } from '@cloudbeaver/core-sdk';

export type Project = Omit<RmProject, 'creator' | 'createTime' | 'canEditConnection' | 'canEditResource'>;

@injectable(() => [GraphQLService, UserInfoResource])
export class ResourceProjectsResource extends CachedDataResource<Project[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super(() => []);

    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
  }

  protected async loader(): Promise<Project[]> {
    const { projects } = await this.graphQLService.sdk.getResourceProjectList();
    return projects;
  }
}
