/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { DataGridContextMenuService } from './DataGrid/DataGridContextMenu/DataGridContextMenuService';
import { DataGridContextMenuSortingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSortingService';
import { DataGridSettingsService } from './DataGridSettingsService';
import { LocaleService } from './LocaleService';
import { SpreadsheetBootstrap } from './SpreadsheetBootstrap';

export const manifest: PluginManifest = {
  info: { name: 'New spreadsheet implementation' },
  providers: [
    SpreadsheetBootstrap,
    DataGridSettingsService,
    LocaleService,
    DataGridContextMenuService,
    DataGridContextMenuSortingService,
  ],
};
