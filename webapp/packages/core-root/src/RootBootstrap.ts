/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SettingsResolverService } from '@cloudbeaver/core-settings';

import { SERVER_SETTINGS_LAYER, ServerSettingsService } from './ServerSettingsService';

@injectable()
export class RootBootstrap extends Bootstrap {
  constructor(
    private readonly settingsResolverService: SettingsResolverService,
    private readonly serverSettingsService: ServerSettingsService,
  ) {
    super();
  }

  register(): void {
    this.settingsResolverService.addResolver(SERVER_SETTINGS_LAYER, this.serverSettingsService);
  }
}
