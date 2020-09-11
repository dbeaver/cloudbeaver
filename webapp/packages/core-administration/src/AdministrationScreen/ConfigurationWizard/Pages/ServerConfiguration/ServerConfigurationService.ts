/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UsersResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutor, Executor, IContextProvider } from '@cloudbeaver/core-executor';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { AdministrationScreenService } from '../../../AdministrationScreenService';
import { IServerConfigurationPageState } from './IServerConfigurationPageState';

@injectable()
export class ServerConfigurationService {

  readonly state: IServerConfigurationPageState;
  readonly validationTask: IExecutor<boolean>;

  constructor(
    private administrationScreenService: AdministrationScreenService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private usersResource: UsersResource
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
    this.validationTask = new Executor();
  }

  isDone() {
    return this.isFormFilled();
  }

  async validate() {
    const context = await this.validationTask.execute(true);
    const state = await context.getContext(this.validationStatusContext);

    return state.getState();
  }

  validationStatusContext = (context: IContextProvider<boolean>) => {
    let state = this.isFormFilled();

    const invalidate = () => {
      state = false;
    };
    const getState = () => state;

    return {
      getState,
      invalidate,
    };
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
      await this.graphQLService.sdk.setDefaultNavigatorSettings({ settings: this.state.navigatorConfig });
      await this.graphQLService.sdk.configureServer({ configuration: this.state.serverConfig });
      this.usersResource.refreshAllLazy();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t save server configuration');

      throw exception;
    }
  }

}
