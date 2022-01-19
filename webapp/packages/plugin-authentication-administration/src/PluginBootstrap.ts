/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ServerConfigurationAdministrationNavService, ServerConfigurationService } from '@cloudbeaver/plugin-administration';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import { AuthConfigurationsAdministrationNavService } from './Administration/IdentityProviders/AuthConfigurationsAdministrationNavService';
import { AuthenticationProviders } from './Administration/ServerConfiguration/AuthenticationProviders';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly serverConfigurationAdministrationNavService: ServerConfigurationAdministrationNavService,
    private readonly authConfigurationsAdministrationNavService: AuthConfigurationsAdministrationNavService,
    private readonly authenticationService: AuthenticationService
  ) {
    super();
  }

  register(): void {
    this.serverConfigurationService.configurationContainer.add(AuthenticationProviders, 0);
    this.authenticationService.setConfigureAuthProvider(
      () => this.serverConfigurationAdministrationNavService.navToSettings()
    );
    this.authenticationService.setConfigureIdentityProvider(
      () => this.authConfigurationsAdministrationNavService.navToCreate()
    );
  }

  load(): void | Promise<void> { }
}
