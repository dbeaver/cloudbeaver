/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import { ConnectionFormService } from './ConnectionFormService.js';
import type { IConnectionFormState } from './IConnectionFormState.js';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { ConnectionInfoResource, createConnectionParam, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { ResourceKeySimple } from '@cloudbeaver/core-resource';

export class ConnectionFormState extends FormState<IConnectionFormState> {
  constructor(
    private readonly serviceProvider: IServiceProvider,
    service: ConnectionFormService,
    config: IConnectionFormState,
  ) {
    super(serviceProvider, service, config);

    const projectInfoResource = serviceProvider.getService(ProjectInfoResource);
    const projectsService = serviceProvider.getService(ProjectsService);
    const resource = serviceProvider.getService(ConnectionInfoResource);

    resource.onItemUpdate.removeHandler(this.syncInfo.bind(this));
    projectInfoResource.onDataUpdate.removeHandler(this.syncProject.bind(this));
    projectsService.onActiveProjectChange.removeHandler(this.syncProject.bind(this));
  }

  private async syncInfo(key: ResourceKeySimple<IConnectionInfoParams>) {
    const resource = this.serviceProvider.getService(ConnectionInfoResource);

    if (
      !this.state.config.connectionId ||
      this.state.projectId === null ||
      !resource.isIntersect(key, createConnectionParam(this.state.projectId, this.state.config.connectionId))
    ) {
      return;
    }

    await this.reload();
  }

  private async syncProject() {
    if (!this.state.projectId) {
      return;
    }

    const projectInfoResource = this.serviceProvider.getService(ProjectInfoResource);
    const projectsService = this.serviceProvider.getService(ProjectsService);

    const project = projectInfoResource.get(this.state.projectId);
    if (!project?.canEditDataSources || !projectsService.activeProjects.includes(project)) {
      await this.dispose();
    }
  }
}
