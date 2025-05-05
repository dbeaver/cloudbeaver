/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SettingsAdministrationService } from '@cloudbeaver/plugin-settings-administration';
import { ServerSettingsService } from '@cloudbeaver/core-root';

@injectable()
export class SettingsDefaultAdministrationBootstrap extends Bootstrap {
  constructor(
    private readonly settingsAdministrationService: SettingsAdministrationService,
    private readonly serverSettingsService: ServerSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.settingsAdministrationService.tabsContainer.add({
      key: 'default',
      name: 'plugin_settings_default_administration_settings_tab_name',
      order: 0,
      options: {
        source: this.serverSettingsService,
        accessor: ['server'],
      },
      panel: () => () => null,
    });
  }
}
