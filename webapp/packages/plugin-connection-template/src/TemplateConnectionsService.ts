/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';

import { TemplateConnectionsResource } from './TemplateConnectionsResource.js';

@injectable()
export class TemplateConnectionsService {
  get projectTemplates(): Connection[] {
    if (this.projectsService.userProject && this.projectsService.activeProjects.includes(this.projectsService.userProject)) {
      return this.templateConnectionsResource.data;
    }

    // return this.templateConnectionsResource.data
    //   .filter(
    // connection => this.projectsService.activeProjects.some(project => project.id === connection.projectId)
    // );
    return [];
  }
  constructor(
    private readonly templateConnectionsResource: TemplateConnectionsResource,
    private readonly projectsService: ProjectsService,
  ) {}
}
