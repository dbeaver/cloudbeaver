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

import { Project, ProjectsResource } from './ProjectsResource';

@injectable()
export class ProjectsService {
  get activeProject(): Project | undefined {
    let project: Project | undefined;

    if (this.activeProjectId) {
      project = this.projectsResource.get(this.activeProjectId);
    }

    if (!project && this.userInfoResource.data) {
      project =  this.projectsResource.get(this.userInfoResource.data.userId);
    }

    if (!project && this.projectsResource.values.length > 0) {
      project = this.projectsResource.values[0];
    }

    return project;
  }

  private activeProjectId: string | null;

  constructor(
    private readonly projectsResource: ProjectsResource,
    private readonly userInfoResource: UserInfoResource
  ) {
    this.activeProjectId = null;

    makeObservable(this, {
      activeProject: computed,
    });
  }

  setActiveProject(project: Project): void {
    this.activeProjectId = project.id;
  }
}