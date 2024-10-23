/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const dataSpreadsheetNewManifest: PluginManifest = {
  info: { name: 'New spreadsheet implementation' },
  providers: [
    () => import('./SpreadsheetBootstrap.js').then(m => m.SpreadsheetBootstrap),
    () => import('./DataGridSettingsService.js').then(m => m.DataGridSettingsService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./DataGrid/DataGridContextMenu/DataGridContextMenuOrderService.js').then(m => m.DataGridContextMenuOrderService),
    () =>
      import('./DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService.js').then(
        m => m.DataGridContextMenuFilterService,
      ),
    () => import('./DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService.js').then(m => m.DataGridContextMenuCellEditingService),
    () => import('./DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService.js').then(m => m.DataGridContextMenuSaveContentService),
  ],
};
