/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SESSION_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import { SettingsResolverService } from '@cloudbeaver/core-settings';

import { UserSettingsService } from './UserSettingsService.js';

@injectable()
export class SettingsUserBootstrap extends Bootstrap {
  constructor(
    private readonly settingsResolverService: SettingsResolverService,
    private readonly userSettingsService: UserSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.settingsResolverService.addResolver(SESSION_SETTINGS_LAYER, this.userSettingsService);
  }
}
