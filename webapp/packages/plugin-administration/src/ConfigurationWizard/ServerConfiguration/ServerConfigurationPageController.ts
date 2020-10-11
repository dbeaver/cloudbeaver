/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { IServerConfigurationPageState } from './IServerConfigurationPageState';
import { ServerConfigurationService } from './ServerConfigurationService';

@injectable()
export class ServerConfigurationPageController {
  get state(): IServerConfigurationPageState {
    return this.serverConfigurationService.state;
  }

  get editing(): boolean {
    return !this.administrationScreenService.isConfigurationMode;
  }

  constructor(
    private readonly configurationWizardService: ConfigurationWizardService,
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly administrationScreenService: AdministrationScreenService
  ) {
  }

  reset = (): void => {
    this.serverConfigurationService.loadConfig();
  };

  onChange = (): void => {
    if (!this.state.serverConfig.authenticationEnabled) {
      this.state.serverConfig.anonymousAccessEnabled = true;
    }
  };

  finish = async (): Promise<void> => {
    if (this.administrationScreenService.isConfigurationMode) {
      await this.configurationWizardService.next();
    } else {
      if (this.serverConfigurationService.validate()) {
        await this.serverConfigurationService.apply();
      }
    }
  };
}
