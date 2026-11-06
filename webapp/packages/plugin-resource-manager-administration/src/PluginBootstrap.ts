/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ServerConfigurationConfigurationService } from '@cloudbeaver/plugin-administration';

const ResourceManagerSettings = importLazyComponent(() => import('./ResourceManagerSettings.js').then(m => m.ResourceManagerSettings));

@injectable(() => [ServerConfigurationConfigurationService])
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly serverConfigurationConfigurationService: ServerConfigurationConfigurationService) {
    super();
  }

  override register(): void | Promise<void> {
    this.serverConfigurationConfigurationService.workspaceContainer.add(ResourceManagerSettings, 0);
  }

  override async load(): Promise<void> {}
}
