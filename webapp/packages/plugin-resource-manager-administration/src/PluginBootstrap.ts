/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type ILoadConfigData, ServerConfigurationService } from '@cloudbeaver/plugin-administration';

import { ResourceManagerSettings } from './ResourceManagerSettings.js';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly notificationService: NotificationService,
  ) {
    super();

    this.loadConfigHandler = this.loadConfigHandler.bind(this);
  }

  override register(): void | Promise<void> {
    this.serverConfigurationService.pluginsContainer.add(ResourceManagerSettings, 0);
    this.serverConfigurationService.loadConfigTask.addHandler(this.loadConfigHandler);
  }

  override async load(): Promise<void> {}

  private async loadConfigHandler(data: ILoadConfigData, contexts: IExecutionContextProvider<ILoadConfigData>) {
    if (!data.reset) {
      return;
    }

    try {
      const config = await this.serverConfigResource.load();

      if (!config) {
        return;
      }

      data.state.serverConfig.resourceManagerEnabled = config.resourceManagerEnabled;
    } catch (exception) {
      ExecutorInterrupter.interrupt(contexts);
      this.notificationService.logException(exception as any, "Can't load server configuration");
    }
  }
}
