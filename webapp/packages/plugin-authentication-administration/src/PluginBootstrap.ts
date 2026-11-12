/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerConfigurationAdministrationNavService, ServerConfigurationFormService } from '@cloudbeaver/plugin-administration';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService.js';

const ServerConfigurationAuthenticationPanel = importLazyComponent(() =>
  import('./Administration/ServerConfiguration/ServerConfigurationAuthenticationPanel.js').then(m => m.ServerConfigurationAuthenticationPanel),
);

@injectable(() => [ServerConfigurationAdministrationNavService, AuthenticationService, TeamsAdministrationService, ServerConfigurationFormService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationAdministrationNavService: ServerConfigurationAdministrationNavService,
    private readonly authenticationService: AuthenticationService,
    private readonly teamsAdministrationService: TeamsAdministrationService,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationFormService.parts.add({
      key: 'authentication',
      name: 'authentication_administration_server_configuration_authentication',
      order: 2,
      panel: () => ServerConfigurationAuthenticationPanel,
    });

    this.teamsAdministrationService.register();
    this.authenticationService.setConfigureAuthProvider(() => this.serverConfigurationAdministrationNavService.navToSettings());
  }
}
