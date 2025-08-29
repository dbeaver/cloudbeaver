/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SettingsLocalizationService } from './SettingsLocalizationService.js';
import { SettingsLocalizationBootstrap } from './SettingsLocalizationBootstrap.js';
import { LocalizationSettingsManagerService } from './LocalizationSettingsManagerService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-settings-localization',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, SettingsLocalizationBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, LocalizationSettingsManagerService)
      .addSingleton(Dependency, proxy(SettingsLocalizationService))
      .addSingleton(SettingsLocalizationService);
  },
});
