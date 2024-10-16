/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppAuthService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { PermissionsService } from '@cloudbeaver/core-root';
import { GraphQLService, type RmResourceType, type ProjectInfo as SchemaProjectInfo } from '@cloudbeaver/core-sdk';

import { createResourceOfType } from './createResourceOfType.js';

export type ProjectInfo = SchemaProjectInfo;
export type ProjectInfoResourceType = RmResourceType;

@injectable()
export class ProjectInfoResource extends CachedMapResource<string, ProjectInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
    permissionsService: PermissionsService,
    appAuthService: AppAuthService,
  ) {
    super(() => new Map(), []);

    this.sync(
      this.userInfoResource,
      () => {},
      () => CachedMapAllKey,
    );
    appAuthService.requireAuthentication(this);
    permissionsService.requirePublic(this);
    this.userInfoResource.onUserChange.addPostHandler(() => {
      this.clear();
    });
  }

  getNameWithoutExtension(projectId: string, resourceTypeId: string, fileName: string): string {
    const project = this.get(projectId);

    if (project) {
      const resourceType = this.getResourceType(project, resourceTypeId);

      for (let ext of resourceType?.fileExtensions || []) {
        ext = `.${ext}`;
        if (fileName.toLowerCase().endsWith(ext)) {
          return fileName.slice(0, fileName.length - ext.length);
        }
      }
    }

    return fileName;
  }

  getNameWithExtension(projectId: string, resourceTypeId: string, fileName: string): string {
    const project = this.get(projectId);

    if (project) {
      const resourceType = this.getResourceType(project, resourceTypeId);

      if (resourceType?.fileExtensions.length) {
        return createResourceOfType(resourceType, fileName);
      }
    }

    return fileName;
  }

  getUserProject(userId: string): ProjectInfo | undefined {
    return this.get(`u_${userId}`);
  }

  isProjectShared(projectId: string | null): boolean {
    if (projectId === null) {
      return false;
    }

    const project = this.get(projectId);

    if (!project) {
      return false;
    }

    return isSharedProject(project);
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
