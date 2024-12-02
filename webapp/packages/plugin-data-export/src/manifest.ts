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
    () => import('./Bootstrap.js').then(m => m.Bootstrap),
    () => import('./DataExportMenuService.js').then(m => m.DataExportMenuService),
    () => import('./DataExportService.js').then(m => m.DataExportService),
    () => import('./DataExportProcessService.js').then(m => m.DataExportProcessService),
    () => import('./DataTransferProcessorsResource.js').then(m => m.DataTransferProcessorsResource),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./Dialog/DefaultExportOutputSettingsResource.js').then(m => m.DefaultExportOutputSettingsResource),
  ],
};
