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
  get userProject(): ProjectInfo | undefined {
    let project: ProjectInfo | undefined;

    if (this.userInfoResource.data) {
      project =  this.projectInfoResource.getUserProject(this.userInfoResource.data.userId);
    } else {
      project = this.projectInfoResource.get('anonymous');
    }

    return project;
  }

  get activeProjects(): ProjectInfo[] {
    let activeProjects: ProjectInfo[] = [];

    if (activeProjects.length === 0 && this.activeProjectIds.length > 0) {
      activeProjects =  this.projectInfoResource
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
      activeProjects = [...this.projectInfoResource.values];
    }

    return activeProjects;
  }

  get defaultProject(): ProjectInfo | undefined {
    let project = this.userProject;

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
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly userDataService: UserDataService,
    navigationService: NavigationService
  ) {
    this.getActiveProjectTask = new SyncExecutor();
    this.onActiveProjectChange = new Executor();

    this.onActiveProjectChange.before(navigationService.navigationTask);

    makeObservable(this, {
      userProject: computed,
      defaultProject: computed,
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
    await this.projectInfoResource.load(CachedMapAllKey);
  }
}