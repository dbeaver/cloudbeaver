/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { CookiesSettingsService } from './CookiesSettingsService';

@injectable()
export class CookiesService {
  get cookiesEnabled() {
    return !this.cookiesSettingsService.settings.getValue('disabled');
  }

  constructor(private readonly cookiesSettingsService: CookiesSettingsService) {}
}