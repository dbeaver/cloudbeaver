/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ILoadConfigData, IServerConfigSaveData, serverConfigStateContext, ServerConfigurationService, serverConfigValidationContext } from '@cloudbeaver/plugin-administration';

@injectable()
export class ServerConfigurationAuthenticationBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  register(): void {
    this.serverConfigurationService.validationTask.addHandler(this.validateForm);
    this.serverConfigurationService.prepareConfigTask.addHandler(this.prepareConfig);
    this.serverConfigurationService.loadConfigTask.addHandler(this.loadServerConfig);
  }

  load(): void { }

  private loadServerConfig: IExecutorHandler<ILoadConfigData> = async (data, contexts) => {
    const providers = await this.authProvidersResource.load();
    const disabled = providers.length === 1 && !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID);

    if (disabled) {
      data.state.serverConfig.enabledAuthProviders = providers.map(provider => provider.id);
      data.state.serverConfig.authenticationEnabled = true;
    }

    if (!data.reload) {
      return;
    }

    try {
      const config = await this.serverConfigResource.load();

      if (!config) {
        return;
      }

      if (config.configurationMode) {
        data.state.serverConfig.adminName = 'cbadmin';
        data.state.serverConfig.adminPassword = '';

        data.state.serverConfig.anonymousAccessEnabled = true;
        data.state.serverConfig.authenticationEnabled = true;
      } else {
        data.state.serverConfig.anonymousAccessEnabled = config.anonymousAccessEnabled;
        data.state.serverConfig.authenticationEnabled = config.authenticationEnabled;
      }

      data.state.serverConfig.enabledAuthProviders = config.enabledAuthProviders;
    } catch (exception) {
      ExecutorInterrupter.interrupt(contexts);
      this.notificationService.logException(exception, 'Can\'t load server configuration');
    }
  };

  private prepareConfig: IExecutorHandler<IServerConfigSaveData> = async (data, contexts) => {
    const providers = await this.authProvidersResource.load();
    const disabled = providers.length === 1 && !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID);

    const state = contexts.getContext(serverConfigStateContext);

    state.serverConfig.anonymousAccessEnabled = data.state.serverConfig.anonymousAccessEnabled;
    state.serverConfig.authenticationEnabled = data.state.serverConfig.authenticationEnabled;
    state.serverConfig.enabledAuthProviders = data.state.serverConfig.enabledAuthProviders;

    if (disabled) {
      state.serverConfig.enabledAuthProviders = providers.map(provider => provider.id);
      state.serverConfig.authenticationEnabled = true;
    }

    if (
      data.configurationWizard
      && state.serverConfig.enabledAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID)
    ) {
      state.serverConfig.adminName = data.state.serverConfig.adminName;
      state.serverConfig.adminPassword = data.state.serverConfig.adminPassword;
    }
  };

  private validateForm: IExecutorHandler<IServerConfigSaveData> = (data, contexts) => {
    const validation = contexts.getContext(serverConfigValidationContext);

    if (
      data.configurationWizard
      && data.state.serverConfig.enabledAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID)
    ) {
      if (!data.state.serverConfig.adminName
        || data.state.serverConfig.adminName.length < 6
        || !data.state.serverConfig.adminPassword
      ) {
        validation.invalidate();
      }
    }
  };
}
