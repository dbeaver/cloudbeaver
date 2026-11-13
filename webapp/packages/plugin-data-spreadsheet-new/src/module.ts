/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService.js';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService.js';
import { DataGridContextMenuGenerateSqlService } from './DataGrid/DataGridContextMenu/DataGridContextMenuGenerateSqlService.js';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService.js';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService.js';
import { DataGridSettingsService } from './DataGridSettingsService.js';
import { LocaleService } from './LocaleService.js';
import { SpreadsheetBootstrap } from './SpreadsheetBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-spreadsheet-new',

  services: () => [
    DataGridContextMenuCellEditingService,
    DataGridSettingsService,
    DataGridContextMenuSaveContentService,
    DataGridContextMenuGenerateSqlService,
    DataGridContextMenuOrderService,
    DataGridContextMenuFilterService,
  ],
  bootstraps: () => [SpreadsheetBootstrap, LocaleService],
});
