/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { SpreadsheetBootstrap } from './SpreadsheetBootstrap.js';
import { DataGridSettingsService } from './DataGridSettingsService.js';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService.js';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService.js';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService.js';
import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-spreadsheet-new',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(DataGridSettingsService))
      .addSingleton(Bootstrap, SpreadsheetBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(DataGridContextMenuCellEditingService)
      .addSingleton(DataGridSettingsService)
      .addSingleton(DataGridContextMenuSaveContentService)
      .addSingleton(DataGridContextMenuOrderService)
      .addSingleton(DataGridContextMenuFilterService);
  },
});
