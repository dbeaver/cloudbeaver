/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { SystemThemeService } from './SystemThemeService.js';
import { ThemeService } from './ThemeService.js';
import { ThemeSettingsManagementService } from './ThemeSettingsManagementService.js';
import { ThemeSettingsService } from './ThemeSettingsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-theming',

  services: () => [SystemThemeService, ThemeSettingsService, ThemeService, ThemeSettingsManagementService],
  bootstraps: () => [ThemeService, LocaleService, SystemThemeService],
});
