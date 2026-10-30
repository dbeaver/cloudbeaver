/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { SettingsAdministrationService } from './SettingsAdministrationService.js';
import { SettingsAdministrationPluginBootstrap } from './SettingsAdministrationPluginBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { WizardLanguageSelectorBootstrap } from './WizardLanguageSelectorBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-settings-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, SettingsAdministrationPluginBootstrap)
      .addSingleton(Bootstrap, WizardLanguageSelectorBootstrap)
      .addSingleton(SettingsAdministrationService);
  },
});
