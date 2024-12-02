/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerConfigurationService } from '@cloudbeaver/plugin-administration';

import { ResourceManagerSettings } from './ResourceManagerSettings.js';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly serverConfigurationService: ServerConfigurationService) {
    super();
  }

  override register(): void | Promise<void> {
    this.serverConfigurationService.pluginsContainer.add(ResourceManagerSettings, 0);
  }

  override async load(): Promise<void> {}
}
