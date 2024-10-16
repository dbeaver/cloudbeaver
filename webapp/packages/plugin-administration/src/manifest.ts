/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationService.js').then(m => m.ServerConfigurationService),
    () => import('./ConfigurationWizard/ServerConfigurationAdministrationNavService.js').then(m => m.ServerConfigurationAdministrationNavService),
    () => import('./ConfigurationWizard/ConfigurationWizardPagesBootstrapService.js').then(m => m.ConfigurationWizardPagesBootstrapService),
    () => import('./AdministrationScreen/AdministrationScreenServiceBootstrap.js').then(m => m.AdministrationScreenServiceBootstrap),
    () => import('./AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService.js').then(m => m.AdministrationTopAppBarService),
    () => import('./AdministrationScreen/ConfigurationWizard/WizardTopAppBar/WizardTopAppBarService.js').then(m => m.WizardTopAppBarService),
    () => import('./Administration/AdministrationViewService.js').then(m => m.AdministrationViewService),
    () => import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationFormStateManager.js').then(m => m.ServerConfigurationFormStateManager),
    () => import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationFormService.js').then(m => m.ServerConfigurationFormService),
  ],
};
