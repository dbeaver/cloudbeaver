/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { BrowserSettingsService } from '@cloudbeaver/core-browser-settings';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class CookiesService {
  get cookiesEnabled() {
    return !this.browserSettingsService.disabled;
  }

  constructor(private readonly browserSettingsService: BrowserSettingsService) {}
}
