/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppAuthService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, ProjectInfo as SchemaProjectInfo, CachedMapResource, CachedMapAllKey, resourceKeyList, RmResourceType } from '@cloudbeaver/core-sdk';

export type ProjectInfo = SchemaProjectInfo;
export type ProjectInfoResourceType = RmResourceType;

@injectable()
export class ProjectInfoResource extends CachedMapResource<string, ProjectInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
    appAuthService: AppAuthService,
  ) {
    super(() => new Map(), []);

    this.sync(this.userInfoResource, () => {}, () => CachedMapAllKey);
    appAuthService.requireAuthentication(this);
    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
  }

  getUserProject(userId: string): ProjectInfo | undefined {
    return this.get(`u_${userId}`);
  }

  getResourceType(project: ProjectInfo, resourceTypeId: string): ProjectInfoResourceType | undefined {
    const resourceType = project.resourceTypes.find(type => type.id === resourceTypeId);

    return resourceType;
  }

  protected async loader(): Promise<Map<string, ProjectInfo>> {
    const { projects } = await this.graphQLService.sdk.getProjectList();

    this.replace(resourceKeyList(projects.map(project => project.id)), projects);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export function projectInfoSortByName(a: ProjectInfo, b: ProjectInfo) {
  if (a.id === b.id) {
    return 0;
  }

  if (isGlobalProject(a) !== isGlobalProject(b)) {
    return +isGlobalProject(a) - +isGlobalProject(b);
  }

  if (isSharedProject(a) !== isSharedProject(b)) {
    return +isSharedProject(a) - +isSharedProject(b);
  }

  return a.name.localeCompare(b.name);
}

export function isGlobalProject(obj?: ProjectInfo): obj is ProjectInfo {
  return obj?.global === true;
}

export function isSharedProject(obj?: ProjectInfo): obj is ProjectInfo {
  return obj?.shared === true;
}