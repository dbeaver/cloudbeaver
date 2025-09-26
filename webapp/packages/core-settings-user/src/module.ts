/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SettingsUserBootstrap } from './SettingsUserBootstrap.js';
import { UserSettingsService } from './UserSettingsService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-settings-user',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(SettingsUserBootstrap))
      .addSingleton(SettingsUserBootstrap)
      .addSingleton(UserSettingsService);
  },
});
