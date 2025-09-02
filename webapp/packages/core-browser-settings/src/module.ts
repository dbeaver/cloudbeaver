/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { BrowserSettingsService } from './BrowserSettingsService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-browser-settings',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(BrowserSettingsService))
      .addSingleton(BrowserSettingsService);
  },
});
