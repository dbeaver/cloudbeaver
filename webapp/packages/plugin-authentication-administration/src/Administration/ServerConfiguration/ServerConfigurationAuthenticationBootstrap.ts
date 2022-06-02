/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ILoadConfigData, IServerConfigSaveData, ServerConfigurationService, serverConfigValidationContext } from '@cloudbeaver/plugin-administration';

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
    this.serverConfigurationService.loadConfigTask.addHandler(this.loadServerConfig);
  }

  load(): void { }

  private readonly loadServerConfig: IExecutorHandler<ILoadConfigData> = async (data, contexts) => {
    if (!data.reset) {
      return;
    }

    try {
      const config = await this.serverConfigResource.load();

      if (!config) {
        return;
      }

      if (config.configurationMode) {
        await this.authProvidersResource.loadAll();
        if (this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID)) {
          data.state.serverConfig.adminName = 'cbadmin';
          data.state.serverConfig.adminPassword = '';
        }
      } else {
        data.state.serverConfig.adminName = undefined;
        data.state.serverConfig.adminPassword = undefined;
      }

      data.state.serverConfig.anonymousAccessEnabled = config.anonymousAccessEnabled;
      data.state.serverConfig.enabledAuthProviders = [...config.enabledAuthProviders];
      data.state.serverConfig.enabledFeatures = [...config.enabledFeatures];
    } catch (exception: any) {
      ExecutorInterrupter.interrupt(contexts);
      this.notificationService.logException(exception, 'Can\'t load server configuration');
    }
  };

  private readonly validateForm: IExecutorHandler<IServerConfigSaveData> = async (data, contexts) => {
    await this.authProvidersResource.loadAll();
    const administratorPresented = data.configurationWizard && this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID);

    if (!administratorPresented) {
      return;
    }

    const validation = contexts.getContext(serverConfigValidationContext);

    if (!data.state.serverConfig.adminName
        || data.state.serverConfig.adminName.length < 6
        || !data.state.serverConfig.adminPassword
    ) {
      validation.invalidate();
    }
  };
}
