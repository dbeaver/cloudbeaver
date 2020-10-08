/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { IServerConfigurationPageState } from './IServerConfigurationPageState';
import { ServerConfigurationService } from './ServerConfigurationService';

@injectable()
export class ServerConfigurationPageController {
  get state(): IServerConfigurationPageState {
    return this.serverConfigurationService.state;
  }

  constructor(
    private readonly configurationWizardService: ConfigurationWizardService,
    private readonly serverConfigurationService: ServerConfigurationService,
  ) {
  }

  onChange = (): void => {
    if (!this.state.serverConfig.authenticationEnabled) {
      this.state.serverConfig.anonymousAccessEnabled = true;
    }
  };

  finish = async (): Promise<void> => await this.configurationWizardService.next();
}
