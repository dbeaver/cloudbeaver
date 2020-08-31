/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { AdministrationScreenService } from '../../../AdministrationScreenService';
import { ConfigurationWizardService } from '../../ConfigurationWizardService';
import { IServerConfigurationPageState } from './IServerConfigurationPageState';

@injectable()
export class ServerConfigurationPageController {
  @observable readonly state: IServerConfigurationPageState;

  constructor(
    private administrationScreenService: AdministrationScreenService,
    private configurationWizardService: ConfigurationWizardService
  ) {
    this.state = this.administrationScreenService.getItemState<IServerConfigurationPageState>('welcome', () => ({
      serverConfig: {
        serverName: 'CloudBeaver',
        adminName: 'admin',
        adminPassword: '',
        anonymousAccessEnabled: true,
        authenticationEnabled: false,
        customConnectionsEnabled: false,
      },
      navigatorConfig: {
        hideFolders: false,
        hideSchemas: false,
        hideVirtualModel: false,
        mergeEntities: false,
        showOnlyEntities: false,
        showSystemObjects: false,
        showUtilityObjects: false,
      },
    }));
  }

  onChange = () => {
    if (!this.state.serverConfig.authenticationEnabled) {
      this.state.serverConfig.anonymousAccessEnabled = true;
    }
  }

  finish = () => this.configurationWizardService.next()
}
