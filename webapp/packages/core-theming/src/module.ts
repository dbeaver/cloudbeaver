/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ThemeSettingsService } from './ThemeSettingsService.js';
import { ThemeSettingsManagementService } from './ThemeSettingsManagementService.js';
import { ThemeService } from './ThemeService.js';
import { LocaleService } from './LocaleService.js';
import { SystemThemeService } from './SystemThemeService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-theming',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ThemeService))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(SystemThemeService))
      .addSingleton(Dependency, ThemeSettingsManagementService)
      .addSingleton(SystemThemeService)
      .addSingleton(ThemeSettingsService)
      .addSingleton(ThemeService);
  },
});
