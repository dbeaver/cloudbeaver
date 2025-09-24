/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PermissionsResource } from './PermissionsResource.js';
import { ConfigurationWizardService } from './AdministrationScreen/ConfigurationWizard/ConfigurationWizardService.js';
import { ConfigurationWizardScreenService } from './AdministrationScreen/ConfigurationWizard/ConfigurationWizardScreenService.js';
import { AdministrationScreenService } from './AdministrationScreen/AdministrationScreenService.js';
import { AdministrationLocaleService } from './AdministrationLocaleService.js';
import { AdministrationItemService } from './AdministrationItem/AdministrationItemService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, AdministrationLocaleService)
      .addSingleton(Dependency, proxy(ConfigurationWizardScreenService))
      .addSingleton(Dependency, proxy(PermissionsResource))
      .addSingleton(AdministrationItemService)
      .addSingleton(PermissionsResource)
      .addSingleton(ConfigurationWizardService)
      .addSingleton(ConfigurationWizardScreenService)
      .addSingleton(AdministrationScreenService);
  },
});
