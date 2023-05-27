/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import { BrowserSettingsService } from './BrowserSettingsService';

@injectable()
export class CookiesService {
  get cookiesEnabled() {
    if (this.browserSettingsService.settings.isValueDefault('cookies.disabled')) {
      return !this.browserSettingsService.deprecatedSettings.getValue('disabled');
    }
    return !this.browserSettingsService.settings.getValue('cookies.disabled');
  }

  constructor(private readonly browserSettingsService: BrowserSettingsService) {}
}
