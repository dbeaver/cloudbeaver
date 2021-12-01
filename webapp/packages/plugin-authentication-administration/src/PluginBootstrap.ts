/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ServerConfigurationService } from '@cloudbeaver/plugin-administration';

import { AuthenticationProviders } from './Administration/ServerConfiguration/AuthenticationProviders';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigurationService: ServerConfigurationService,
  ) {
    super();
  }

  register(): void {
    this.serverConfigurationService.configurationContainer.add(AuthenticationProviders, 0);
  }

  load(): void | Promise<void> { }
}
