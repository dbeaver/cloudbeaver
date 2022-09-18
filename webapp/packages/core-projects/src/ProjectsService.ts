/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { UserDataService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor, ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-sdk';
import { NavigationService } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { activeProjectsContext } from './activeProjectsContext';
import { ProjectInfo, ProjectInfoResource } from './ProjectInfoResource';

interface IProjectsUserSettings {
  activeProjectIds: string[];
}

@injectable()
export class ProjectsService {
  get activeProjects(): ProjectInfo[] {
    let activeProjects: ProjectInfo[] = [];

    if (activeProjects.length === 0 && this.activeProjectIds.length > 0) {
      activeProjects =  this.projectsResource
        .get(resourceKeyList(this.activeProjectIds))
        .filter(Boolean) as ProjectInfo[];
    }

    if (activeProjects.length === 0) {
      const contexts = this.getActiveProjectTask.execute();
      const projectsContext = contexts.getContext(activeProjectsContext);

      if (projectsContext.activeProjects.length > 0) {
        activeProjects = projectsContext.activeProjects;
      }
    }

    if (activeProjects.length === 0) {
      activeProjects = [...this.projectsResource.values];
    }

    return activeProjects;
  }

  get defaultProject(): ProjectInfo | undefined {
    let project: ProjectInfo | undefined;

    if (this.userInfoResource.data) {
      project =  this.projectsResource.get(this.userInfoResource.data.userId);
    }

    if (!project && this.projectsResource.has('anonymous')) {
      project = this.projectsResource.get('anonymous');
    }

    if (!project && this.activeProjects.length > 0) {
      project = this.activeProjects[0];
    }

    return project;
  }

  get activeProjectIds(): string[] {
    return this.userProjectsSettings.activeProjectIds;
  }

  get userProjectsSettings(): IProjectsUserSettings {
    return this.userDataService.getUserData('projects-settings', () => ({
      activeProjectIds: [],
    }), data => Array.isArray(data.activeProjectIds));
  }

  readonly onActiveProjectChange: IExecutor;
  readonly getActiveProjectTask: ISyncExecutor;

  constructor(
    private readonly projectsResource: ProjectInfoResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly userDataService: UserDataService,
    navigationService: NavigationService
  ) {
    this.getActiveProjectTask = new SyncExecutor();
    this.onActiveProjectChange = new Executor();

    this.onActiveProjectChange.before(navigationService.navigationTask);

    makeObservable(this, {
      activeProjects: computed<ProjectInfo[]>({
        equals: isArraysEqual,
      }),
    });
  }

  setActiveProjects(projects: ProjectInfo[]): void {
    this.userProjectsSettings.activeProjectIds = projects.map(project => project.id);
    this.onActiveProjectChange.execute();
  }

  async load(): Promise<void> {
    await this.projectsResource.load(CachedMapAllKey);
  }
}