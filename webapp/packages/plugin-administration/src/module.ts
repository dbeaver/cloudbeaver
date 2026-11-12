/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ServerConfigurationAdministrationNavService } from './ConfigurationWizard/ServerConfigurationAdministrationNavService.js';
import { ServerConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationService.js';
import { ServerConfigurationFormService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationFormService.js';
import { ServerConfigurationFormStateManager } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationFormStateManager.js';
import { ServerConfigurationConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationConfigurationService.js';
import { AdministrationTopAppBarService } from './AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService.js';
import { ConfigurationWizardPagesBootstrapService } from './ConfigurationWizard/ConfigurationWizardPagesBootstrapService.js';
import { WizardTopAppBarService } from './AdministrationScreen/ConfigurationWizard/WizardTopAppBar/WizardTopAppBarService.js';
import { AdministrationScreenServiceBootstrap } from './AdministrationScreen/AdministrationScreenServiceBootstrap.js';
import { AdministrationViewService } from './Administration/AdministrationViewService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(AdministrationScreenServiceBootstrap))
      .addSingleton(Bootstrap, proxy(ConfigurationWizardPagesBootstrapService))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(PluginBootstrap))
      .addSingleton(AdministrationViewService)
      .addSingleton(PluginBootstrap)
      .addSingleton(ServerConfigurationAdministrationNavService)
      .addSingleton(ServerConfigurationService)
      .addSingleton(ServerConfigurationFormService)
      .addSingleton(ServerConfigurationFormStateManager)
      .addSingleton(ServerConfigurationConfigurationService)
      .addSingleton(AdministrationTopAppBarService)
      .addSingleton(ConfigurationWizardPagesBootstrapService)
      .addSingleton(WizardTopAppBarService)
      .addSingleton(AdministrationScreenServiceBootstrap);
  },
});
