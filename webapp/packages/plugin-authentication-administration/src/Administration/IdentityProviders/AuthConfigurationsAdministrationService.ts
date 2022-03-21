/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { AuthConfigurationsResource, AuthProviderService, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AdminAuthProviderConfiguration, CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { AuthConfigurationsAdministration } from './AuthConfigurationsAdministration';
import { AuthConfigurationsDrawerItem } from './AuthConfigurationsDrawerItem';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';
import { IdentityProvidersServiceLink } from './IdentityProvidersServiceLink';

export interface IAuthConfigurationDetailsPlaceholderProps {
  configuration: AdminAuthProviderConfiguration;
}

@injectable()
export class AuthConfigurationsAdministrationService extends Bootstrap {
  readonly configurationDetailsPlaceholder = new PlaceholderContainer<IAuthConfigurationDetailsPlaceholderProps>();

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly notificationService: NotificationService,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly authConfigurationsResource: AuthConfigurationsResource,
    private readonly createConfigurationService: CreateAuthConfigurationService,
    private readonly authProviderService: AuthProviderService
  ) {
    super();
  }

  register(): void {
    this.authProviderService.addServiceDescriptionLink({
      isSupported: provider => provider.configurable,
      description: () => IdentityProvidersServiceLink,
    });
    this.administrationItemService.create({
      name: 'auth-configurations',
      type: AdministrationItemType.Administration,
      order: 5,
      configurationWizardOptions: {
        description: 'administration_identity_providers_wizard_description',
      },
      sub: [
        {
          name: 'create',
          onActivate: () => this.createConfigurationService.fillData(),
        },
      ],
      isHidden: () => !this.authProvidersResource.values.some(provider => provider.configurable),
      getContentComponent: () => AuthConfigurationsAdministration,
      getDrawerComponent: () => AuthConfigurationsDrawerItem,
      onActivate: this.loadConfigurations.bind(this),
      onDeActivate: (configurationWizard, outside) => {
        if (outside) {
          this.authConfigurationsResource.cleanNewFlags();
        }
      },
    });
  }

  load(): void | Promise<void> { }

  private async loadConfigurations() {
    try {
      await this.authConfigurationsResource.load(CachedMapAllKey);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Error occurred while loading configurations');
    }
  }
}
