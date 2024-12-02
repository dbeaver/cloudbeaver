/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import type { AdminObjectGrantInfo } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import {
  CachedMapAllKey,
  CachedMapResource,
  type ResourceKey,
  type ResourceKeyList,
  resourceKeyList,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, type RmProject, type RmProjectPermissions, type RmSubjectProjectPermissions } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

const newSymbol = Symbol('new-project');

export type SharedProject = RmProject;
export type ProjectPermission = RmSubjectProjectPermissions;
export type ProjectSubjectPermission = RmProjectPermissions;
type SharedProjectNew = SharedProject & { [newSymbol]: boolean };

interface IProjectConfig {
  id: string;
  name: string;
  description?: string;
}

@injectable()
export class SharedProjectsResource extends CachedMapResource<string, SharedProject> {
  constructor(
    private readonly graphQLService: GraphQLService,
    projectInfoResource: ProjectInfoResource,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => new Map(), []);

    sessionPermissionsResource.require(this, EAdminPermission.admin);
    sessionPermissionsResource.onDataOutdated.addHandler(() => this.markOutdated());

    this.connect(projectInfoResource);
    this.onDataOutdated.addHandler(() => projectInfoResource.markOutdated());
    this.onItemUpdate.addHandler(() => projectInfoResource.markOutdated());
    this.onItemDelete.addHandler(() => projectInfoResource.markOutdated());
  }

  isNew(id: string): boolean {
    if (!this.has(id)) {
      return true;
    }
    return newSymbol in this.get(id)!;
  }

  cleanNewFlags(): void {
    for (const project of this.data.values()) {
      (project as SharedProjectNew)[newSymbol] = false;
    }
  }

  async addProjectPermissions(projectIds: string[], subjectIds: string[], permissions: string[]): Promise<void> {
    await this.graphQLService.sdk.addProjectsPermissions({
      projectIds,
      subjectIds,
      permissions,
    });
  }

  async deleteProjectPermissions(projectIds: string[], subjectIds: string[], permissions: string[]): Promise<void> {
    await this.graphQLService.sdk.deleteProjectsPermissions({
      projectIds,
      subjectIds,
      permissions,
    });
  }

  async loadAccessSubjects(projectId: string): Promise<AdminObjectGrantInfo[]> {
    const { grantedPermissions } = await this.graphQLService.sdk.getProjectGrantedPermissions({
      projectId,
    });

    return grantedPermissions;
  }

  async loadSubjectAccess(subjectId: string): Promise<AdminObjectGrantInfo[]> {
    const { grantedPermissions } = await this.graphQLService.sdk.getSubjectProjectsPermissions({
      subjectId,
    });

    return grantedPermissions;
  }

  async create(config: IProjectConfig): Promise<SharedProject> {
    const { project } = await this.graphQLService.sdk.createProject({
      projectId: config.id,
      projectName: config.name,
      description: config.description,
    });

    (project as SharedProjectNew)[newSymbol] = true;

    this.set(project.id, project as SharedProject);

    return this.get(project.id)!;
  }

  async deleteProject(id: string): Promise<void>;
  async deleteProject(id: ResourceKeyList<string>): Promise<void>;
  async deleteProject(key: ResourceKey<string>): Promise<void> {
    const deleted: string[] = [];

    try {
      await this.performUpdate(key, undefined, async key => {
        await ResourceKeyUtils.forEachAsync(this.aliases.transformToKey(key), async projectId => {
          await this.graphQLService.sdk.deleteProject({
            projectId,
          });

          deleted.push(projectId);
        });

        this.onDataOutdated.execute(key);
      });
    } finally {
      if (deleted.length > 0) {
        this.delete(resourceKeyList(deleted));
      }
    }
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, SharedProject>> {
    const all = this.aliases.isAlias(key, CachedMapAllKey);

    if (all) {
      const { projects } = await this.graphQLService.sdk.getSharedProjects();

      runInAction(() => {
        this.delete(resourceKeyList(this.keys.filter(id => !projects.some(project => project.id === id))));

        this.set(resourceKeyList(projects.map(project => project.id)), projects as SharedProject[]);
      });
    } else {
      await ResourceKeyUtils.forEachAsync(this.aliases.transformToKey(key), async projectId => {
        const { project } = await this.graphQLService.sdk.getProject({
          projectId,
        });

        this.set(projectId, project as SharedProject);
      });
    }

    return this.data;
  }

  protected override dataSet(key: string, value: SharedProject): void {
    key = this.getKeyRef(key);

    const data = this.data.get(key);
    this.data.set(key, Object.assign(data ?? {}, value));
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export function isEqualSharedProjectGrantInfo(a: AdminObjectGrantInfo, b: AdminObjectGrantInfo): boolean {
  return (
    a.subjectId === b.subjectId &&
    a.subjectType === b.subjectType &&
    a.objectPermissions.objectId === b.objectPermissions.objectId &&
    isArraysEqual(a.objectPermissions.permissions, b.objectPermissions.permissions)
  );
}
