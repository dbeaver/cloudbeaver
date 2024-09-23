/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerConfigurationAdministrationNavService, ServerConfigurationService } from '@cloudbeaver/plugin-administration';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

const AuthenticationProviders = React.lazy(async () => {
  const { AuthenticationProviders } = await import('./Administration/ServerConfiguration/AuthenticationProviders.js');
  return { default: AuthenticationProviders };
});

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly serverConfigurationAdministrationNavService: ServerConfigurationAdministrationNavService,
    private readonly authenticationService: AuthenticationService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationService.configurationContainer.add(AuthenticationProviders, 0);
    this.authenticationService.setConfigureAuthProvider(() => this.serverConfigurationAdministrationNavService.navToSettings());
  }
}
