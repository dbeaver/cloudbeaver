/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { UserFormService } from '../UserFormService';

const ConnectionAccess = React.lazy(async () => {
  const { ConnectionAccess } = await import('./ConnectionAccess');
  return { default: ConnectionAccess };
});

@injectable()
export class ConnectionAccessTabBootstrap extends Bootstrap {
  constructor(
    private readonly userFormService: UserFormService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
  }

  register(): void {
    this.userFormService.tabsContainer.add({
      key: 'connections_access',
      name: 'authentication_administration_user_connections_access',
      title: 'authentication_administration_user_connections_access',
      order: 3,
      panel: () => ConnectionAccess,
      isHidden: () => !this.projectInfoResource.values.some(isGlobalProject),
      onOpen: ({ props }) => props.controller.loadConnectionsAccess(),
    });

    this.userFormService.onFormInit.addHandler(() => this.projectInfoResource.load(CachedMapAllKey));
  }

  load(): void { }
}
