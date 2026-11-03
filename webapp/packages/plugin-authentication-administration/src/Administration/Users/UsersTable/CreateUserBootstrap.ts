/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { UsersAdministrationService } from '../UsersAdministrationService.js';

const CreateUserButton = importLazyComponent(() => import('./CreateUserButton.js').then(m => m.CreateUserButton));

@injectable(() => [AuthProvidersResource, UsersAdministrationService, AdministrationUsersManagementService])
export class CreateUserBootstrap extends Bootstrap {
  constructor(
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly usersAdministrationService: UsersAdministrationService,
    private readonly administrationUsersManagementService: AdministrationUsersManagementService,
  ) {
    super();
  }

  override register(): void {
    this.usersAdministrationService.actions.add(
      CreateUserButton,
      2,
      () => this.administrationUsersManagementService.externalUserProviderEnabled || !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID),
      () => [
        getCachedMapResourceLoaderState(this.authProvidersResource, () => CachedMapAllKey),
        ...this.administrationUsersManagementService.loaders,
      ],
    );
  }
}
