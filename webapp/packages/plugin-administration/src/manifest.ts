/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AdministrationScreenServiceBootstrap } from './AdministrationScreen/AdministrationScreenServiceBootstrap';
import { AdministrationTopAppBarService } from './AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService';
import { WizardTopAppBarService } from './AdministrationScreen/ConfigurationWizard/WizardTopAppBar/WizardTopAppBarService';
import { ConfigurationWizardPagesBootstrapService } from './ConfigurationWizard/ConfigurationWizardPagesBootstrapService';
import { ServerConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationService';
import { ServerConfigurationAdministrationNavService } from './ConfigurationWizard/ServerConfigurationAdministrationNavService';
import { LocaleService } from './LocaleService';
import { PluginBootstrap } from './PluginBootstrap';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    LocaleService,
    PluginBootstrap,
    ServerConfigurationService,
    ServerConfigurationAdministrationNavService,
    ConfigurationWizardPagesBootstrapService,
    AdministrationScreenServiceBootstrap,
    AdministrationTopAppBarService,
    WizardTopAppBarService,
  ],
};
