/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerConfigurationAdministrationNavService, ServerConfigurationService } from '@cloudbeaver/plugin-administration';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService.js';

const AuthenticationProviders = importLazyComponent(() =>
  import('./Administration/ServerConfiguration/AuthenticationProviders.js').then(m => m.AuthenticationProviders),
);

@injectable(() => [ServerConfigurationService, ServerConfigurationAdministrationNavService, AuthenticationService, TeamsAdministrationService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly serverConfigurationAdministrationNavService: ServerConfigurationAdministrationNavService,
    private readonly authenticationService: AuthenticationService,
    private readonly teamsAdministrationService: TeamsAdministrationService,
  ) {
    super();
  }

  override register(): void {
    this.teamsAdministrationService.register();
    this.serverConfigurationService.configurationContainer.add(AuthenticationProviders, 0);
    this.authenticationService.setConfigureAuthProvider(() => this.serverConfigurationAdministrationNavService.navToSettings());
  }
}
