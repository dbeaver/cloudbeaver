/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { UserSettingsResolverService } from './UserSettingsResolverService.js';
import { SettingsResolverService } from './SettingsResolverService.js';
import { SettingsProviderService } from './SettingsProviderService.js';
import { SettingsManagerService } from './SettingsManager/SettingsManagerService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-settings',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(UserSettingsResolverService)
      .addSingleton(SettingsResolverService)
      .addSingleton(SettingsProviderService)
      .addSingleton(SettingsManagerService);
  },
});
