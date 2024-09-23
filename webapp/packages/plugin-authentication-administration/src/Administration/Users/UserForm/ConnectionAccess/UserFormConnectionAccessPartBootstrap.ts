/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { AdministrationUserFormService } from '../AdministrationUserFormService.js';
import { getUserFormConnectionAccessPart } from './getUserFormConnectionAccessPart.js';

const UserFormConnectionAccessPanel = React.lazy(async () => {
  const { UserFormConnectionAccessPanel } = await import('./UserFormConnectionAccessPanel.js');
  return { default: UserFormConnectionAccessPanel };
});

@injectable()
export class UserFormConnectionAccessPartBootstrap extends Bootstrap {
  constructor(
    private readonly administrationUserFormService: AdministrationUserFormService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.administrationUserFormService.parts.add({
      key: 'connections_access',
      name: 'authentication_administration_user_connections_access',
      title: 'authentication_administration_user_connections_access',
      order: 3,
      panel: () => UserFormConnectionAccessPanel,
      isHidden: () => !this.projectInfoResource.values.some(isGlobalProject),
      stateGetter: props => () => getUserFormConnectionAccessPart(props.formState),
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
    });
  }
}
