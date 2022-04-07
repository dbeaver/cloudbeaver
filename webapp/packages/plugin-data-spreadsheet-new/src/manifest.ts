/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService';
import { DataGridContextMenuService } from './DataGrid/DataGridContextMenu/DataGridContextMenuService';
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
    DataGridContextMenuOrderService,
    DataGridContextMenuFilterService,
    DataGridContextMenuCellEditingService,
    DataGridContextMenuSaveContentService,
  ],
};
