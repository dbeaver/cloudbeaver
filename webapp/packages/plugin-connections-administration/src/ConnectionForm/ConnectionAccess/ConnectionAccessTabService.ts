/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { ConnectionFormServiceRefactored } from '@cloudbeaver/plugin-connections';
import { getConnectionFormAccessPart } from './getConnectionFormAccessPart.js';

const ConnectionAccess = React.lazy(async () => {
  const { ConnectionAccess } = await import('./ConnectionAccess.js');
  return { default: ConnectionAccess };
});

@injectable()
export class ConnectionAccessTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly ConnectionFormServiceRefactored: ConnectionFormServiceRefactored,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly permissionsResource: PermissionsService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
    this.key = 'access';
  }

  override register(): void {
    this.ConnectionFormServiceRefactored.parts.add({
      key: this.key,
      name: 'connections_connection_edit_access',
      title: 'connections_connection_edit_access',
      order: 4,
      stateGetter: context => () => getConnectionFormAccessPart(context.formState),
      isHidden: (_, context) => !context || !this.isAccessTabActive(context.formState.state.projectId),
      isDisabled: (tabId, props) => !props?.formState.state.config.driverId || this.administrationScreenService.isConfigurationMode,
      panel: () => ConnectionAccess,
    });
  }

  private isAccessTabActive(projectId: string | null): boolean {
    return projectId !== null && isGlobalProject(this.projectInfoResource.get(projectId)) && this.permissionsResource.has(EAdminPermission.admin);
  }
}
