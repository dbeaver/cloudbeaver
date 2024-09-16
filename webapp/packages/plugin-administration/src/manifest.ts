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
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationService').then(m => m.ServerConfigurationService),
    () => import('./ConfigurationWizard/ServerConfigurationAdministrationNavService').then(m => m.ServerConfigurationAdministrationNavService),
    () => import('./ConfigurationWizard/ConfigurationWizardPagesBootstrapService').then(m => m.ConfigurationWizardPagesBootstrapService),
    () => import('./AdministrationScreen/AdministrationScreenServiceBootstrap').then(m => m.AdministrationScreenServiceBootstrap),
    () => import('./AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService').then(m => m.AdministrationTopAppBarService),
    () => import('./AdministrationScreen/ConfigurationWizard/WizardTopAppBar/WizardTopAppBarService').then(m => m.WizardTopAppBarService),
    () => import('./Administration/AdministrationViewService').then(m => m.AdministrationViewService),
    () => import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationFormStateManager').then(m => m.ServerConfigurationFormStateManager),
    () => import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationFormService').then(m => m.ServerConfigurationFormService),
  ],
};
