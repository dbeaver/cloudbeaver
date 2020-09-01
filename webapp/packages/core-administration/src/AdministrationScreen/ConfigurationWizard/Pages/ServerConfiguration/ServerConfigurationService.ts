/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { AdministrationScreenService } from '../../../AdministrationScreenService';
import { IServerConfigurationPageState } from './IServerConfigurationPageState';

@injectable()
export class ServerConfigurationService {

  readonly state: IServerConfigurationPageState;

  constructor(
    private administrationScreenService: AdministrationScreenService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
  ) {
    this.state = this.administrationScreenService.getItemState<IServerConfigurationPageState>('welcome', () => ({
      serverConfig: {
        serverName: 'CloudBeaver',
        adminName: 'cbadmin',
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

  isDone() {
    return this.isFormFilled();
  }

  validate() {
    return this.isFormFilled();
  }

  private isFormFilled() {

    return !!(
      this.state?.serverConfig.serverName
      && this.state.serverConfig.adminName
      && this.state.serverConfig.adminName.length > 5
      && this.state.serverConfig.adminPassword
    );
  }

  async apply() {
    if (!this.state) {
      throw new Error('No state available');
    }

    try {
      await this.graphQLService.gql.setDefaultNavigatorSettings({ settings: this.state.navigatorConfig });
      await this.graphQLService.gql.configureServer({ configuration: this.state.serverConfig });
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t save server configuration');

      throw exception;
    }
  }

}
