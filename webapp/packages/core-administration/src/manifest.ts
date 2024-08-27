/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreAdministrationManifest: PluginManifest = {
  info: {
    name: 'Core Administration',
  },

  providers: [
    () => import('./AdministrationItem/AdministrationItemService').then(m => m.AdministrationItemService),
    () => import('./PermissionsResource').then(m => m.PermissionsResource),
    () => import('./AdministrationScreen/AdministrationScreenService').then(m => m.AdministrationScreenService),
    () => import('./AdministrationScreen/ConfigurationWizard/ConfigurationWizardService').then(m => m.ConfigurationWizardService),
    () => import('./AdministrationScreen/ConfigurationWizard/ConfigurationWizardScreenService').then(m => m.ConfigurationWizardScreenService),
    () => import('./AdministrationLocaleService').then(m => m.AdministrationLocaleService),
  ],
};
