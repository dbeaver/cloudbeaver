/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { AdministrationViewService } from './Administration/AdministrationViewService.js';
import { AdministrationScreenServiceBootstrap } from './AdministrationScreen/AdministrationScreenServiceBootstrap.js';
import { AdministrationTopAppBarService } from './AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService.js';
import { WizardTopAppBarService } from './AdministrationScreen/ConfigurationWizard/WizardTopAppBar/WizardTopAppBarService.js';
import { ConfigurationWizardPagesBootstrapService } from './ConfigurationWizard/ConfigurationWizardPagesBootstrapService.js';
import { ServerConfigurationConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationConfigurationService.js';
import { ServerConfigurationFormService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationFormService.js';
import { ServerConfigurationFormStateManager } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationFormStateManager.js';
import { ServerConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationService.js';
import { ServerConfigurationAdministrationNavService } from './ConfigurationWizard/ServerConfigurationAdministrationNavService.js';
import { LocaleService } from './LocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-administration',

  services: () => [
    AdministrationViewService,
    PluginBootstrap,
    ServerConfigurationAdministrationNavService,
    ServerConfigurationService,
    ServerConfigurationFormService,
    ServerConfigurationFormStateManager,
    ServerConfigurationConfigurationService,
    AdministrationTopAppBarService,
    ConfigurationWizardPagesBootstrapService,
    WizardTopAppBarService,
    AdministrationScreenServiceBootstrap,
  ],
  bootstraps: () => [AdministrationScreenServiceBootstrap, ConfigurationWizardPagesBootstrapService, LocaleService, PluginBootstrap],
});
