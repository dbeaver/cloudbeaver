/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ProjectsService, PROJECT_GLOBAL_ID } from '@cloudbeaver/core-projects';

import { TemplateConnectionsResource } from './TemplateConnectionsResource';

@injectable()
export class TemplateConnectionsService {
  get projectTemplates(): Connection[] {
    if (
      this.projectsService.userProject
      && this.projectsService.activeProjects.includes(this.projectsService.userProject)
    ) {
      return this.templateConnectionsResource.data
        .filter(
          connection => (
            connection.projectId === PROJECT_GLOBAL_ID
            || this.projectsService.activeProjects.some(
              project => project.id === connection.projectId
            )
          )
        );
    }

    return this.templateConnectionsResource.data
      .filter(connection => this.projectsService.activeProjects.some(project => project.id === connection.projectId));
  }
  constructor(
    private readonly templateConnectionsResource: TemplateConnectionsResource,
    private readonly projectsService: ProjectsService,
  ) {
  }
}
