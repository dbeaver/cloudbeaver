/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsResolverService } from '@cloudbeaver/core-settings';

import { ServerSettingsManagerService } from './Settings/ServerSettingsManagerService.js';
import { SERVER_SETTINGS_LAYER, ServerSettingsService } from './Settings/ServerSettingsService.js';

@injectable()
export class RootBootstrap extends Bootstrap {
  constructor(
    private readonly settingsResolverService: SettingsResolverService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsManagerService: ServerSettingsManagerService,
  ) {
    super();
  }

  override register(): void {
    this.settingsManagerService.registerSettings(
      this.serverSettingsManagerService.settingsProvider,
      this.serverSettingsManagerService.getSettingsGetter(),
      this.serverSettingsManagerService.loaders,
    );
    this.settingsResolverService.addResolver(SERVER_SETTINGS_LAYER, this.serverSettingsService);
  }
}
