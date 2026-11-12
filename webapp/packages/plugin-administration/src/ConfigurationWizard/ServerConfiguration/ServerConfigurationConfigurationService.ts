/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';
import type { IConfigurationPlaceholderProps } from './ServerConfigurationService.js';

const ServerConfigurationConfigurationPanel = importLazyComponent(() =>
  import('./ServerConfigurationConfigurationPanel.js').then(m => m.ServerConfigurationConfigurationPanel),
);

@injectable(() => [ServerConfigurationFormService])
export class ServerConfigurationConfigurationService {
  readonly settingsContainer = new PlaceholderContainer<IConfigurationPlaceholderProps>();
  readonly connectionsContainer = new PlaceholderContainer<IConfigurationPlaceholderProps>();
  readonly workspaceContainer = new PlaceholderContainer<IConfigurationPlaceholderProps>();

  constructor(private readonly serverConfigurationFormService: ServerConfigurationFormService) {}

  register(): void {
    this.serverConfigurationFormService.parts.add({
      key: 'configuration',
      name: 'administration_configuration_wizard_configuration_plugins',
      order: 1,
      panel: () => ServerConfigurationConfigurationPanel,
    });
  }
}
