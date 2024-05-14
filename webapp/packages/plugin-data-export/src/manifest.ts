/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const dataExportManifest: PluginManifest = {
  info: {
    name: 'Data Export Plugin',
  },

  providers: [
    () => import('./Bootstrap').then(m => m.Bootstrap),
    () => import('./DataExportMenuService').then(m => m.DataExportMenuService),
    () => import('./DataExportSettingsService').then(m => m.DataExportSettingsService),
    () => import('./DataExportService').then(m => m.DataExportService),
    () => import('./DataExportProcessService').then(m => m.DataExportProcessService),
    () => import('./DataTransferProcessorsResource').then(m => m.DataTransferProcessorsResource),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./Dialog/DefaultExportOutputSettingsResource').then(m => m.DefaultExportOutputSettingsResource),
  ],
};
