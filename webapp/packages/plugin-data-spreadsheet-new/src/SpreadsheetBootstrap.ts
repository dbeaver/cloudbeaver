/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExceptionsCatcherService } from '@cloudbeaver/core-events';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService';
import { DataGridContextMenuSortingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSortingService';
import { DataGridSettingsService } from './DataGridSettingsService';
import { SpreadsheetGrid } from './SpreadsheetGrid';

@injectable()
export class SpreadsheetBootstrap extends Bootstrap {
  constructor(
    private dataPresentationService: DataPresentationService,
    private dataGridSettingsService: DataGridSettingsService,
    private dataGridContextMenuSortingService: DataGridContextMenuSortingService,
    private dataGridContextMenuFilterService: DataGridContextMenuFilterService,
    exceptionsCatcherService: ExceptionsCatcherService
  ) {
    super();
    exceptionsCatcherService.ignore('ResizeObserver loop limit exceeded'); // Produces by react-data-grid
  }

  register(): void | Promise<void> {
    this.dataPresentationService.add({
      id: 'spreadsheet_grid',
      dataFormat: ResultDataFormat.Resultset,
      getPresentationComponent: () => SpreadsheetGrid,
      hidden: () => this.dataGridSettingsService.settings.getValue('hidden'),
      title: 'Table',
      icon: '/icons/grid.png',
    });
    this.dataGridContextMenuSortingService.register();
    this.dataGridContextMenuFilterService.register();
  }

  load(): void | Promise<void> { }
}
