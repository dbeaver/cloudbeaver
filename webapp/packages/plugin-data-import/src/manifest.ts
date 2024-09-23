/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const dataImportPluginManifest: PluginManifest = {
  info: {
    name: 'Data Import Plugin',
  },

  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./DataImportSettingsService.js').then(m => m.DataImportSettingsService),
    () => import('./DataImportBootstrap.js').then(m => m.DataImportBootstrap),
    () => import('./DataImportService.js').then(m => m.DataImportService),
    () => import('./DataImportProcessorsResource.js').then(m => m.DataImportProcessorsResource),
  ],
};
