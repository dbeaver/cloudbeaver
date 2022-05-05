/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource, RmProject } from '@cloudbeaver/core-sdk';

export type Project = Omit<RmProject, 'creator' | 'description' | 'createTime'>;

@injectable()
export class ProjectsResource extends CachedDataResource<Project[]> {
  get userProjectName(): string {
    const project = this.data.filter(project => !project.shared)[0] as Project | undefined;
    return project?.name ?? '';
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
  ) {
    super([]);

    this.sync(sessionDataResource);

    makeObservable(this, {
      userProjectName: computed,
    });
  }

  protected async loader(): Promise<Project[]> {
    const { projects } = await this.graphQLService.sdk.getProjectList();
    return projects;
  }
}