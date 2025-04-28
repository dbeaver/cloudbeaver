/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { EAdminPermission, PermissionsService, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { ConnectionFormService, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { getConnectionFormAccessPart } from './getConnectionFormAccessPart.js';
import { getCachedDataResourceLoaderState, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

const ConnectionFormAccess = React.lazy(async () => {
  const { ConnectionFormAccess } = await import('./ConnectionFormAccess.js');
  return { default: ConnectionFormAccess };
});

@injectable()
export class ConnectionFormAccessTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly ConnectionFormService: ConnectionFormService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly permissionsResource: PermissionsService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
    this.key = 'access';
  }

  override register(): void {
    this.ConnectionFormService.parts.add({
      key: this.key,
      name: 'connections_connection_edit_access',
      title: 'connections_connection_edit_access',
      order: 4,
      stateGetter: context => () => getConnectionFormAccessPart(context.formState),
      getLoader: (_, context) => [
        getCachedMapResourceLoaderState(this.projectInfoResource, () => context?.formState.state.projectId ?? null),
        getCachedDataResourceLoaderState(this.sessionPermissionsResource, () => undefined),
      ],
      isHidden: (_, context) => !context || !this.isAccessTabActive(context.formState.state.projectId),
      isDisabled: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        return !optionsPart?.state.driverId || this.administrationScreenService.isConfigurationMode;
      },
      panel: () => ConnectionFormAccess,
    });
  }

  private isAccessTabActive(projectId: string | null): boolean {
    return projectId !== null && isGlobalProject(this.projectInfoResource.get(projectId)) && this.permissionsResource.has(EAdminPermission.admin);
  }
}