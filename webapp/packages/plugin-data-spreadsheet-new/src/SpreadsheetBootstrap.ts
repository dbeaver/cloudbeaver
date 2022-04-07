/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExceptionsCatcherService } from '@cloudbeaver/core-events';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService';
import { DataGridContextMenuService } from './DataGrid/DataGridContextMenu/DataGridContextMenuService';
import { DataGridSettingsService } from './DataGridSettingsService';
import { SpreadsheetGrid } from './SpreadsheetGrid';

@injectable()
export class SpreadsheetBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataGridSettingsService: DataGridSettingsService,
    private readonly dataGridContextMenuSortingService: DataGridContextMenuOrderService,
    private readonly dataGridContextMenuFilterService: DataGridContextMenuFilterService,
    private readonly dataGridContextMenuCellEditingService: DataGridContextMenuCellEditingService,
    private readonly dataGridContextMenuService: DataGridContextMenuService,
    private readonly dataGridContextMenuSaveContentService: DataGridContextMenuSaveContentService,
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
      icon: 'table-icon-sm',
    });
    this.dataGridContextMenuSortingService.register();
    this.dataGridContextMenuFilterService.register();
    this.dataGridContextMenuCellEditingService.register();
    this.dataGridContextMenuSaveContentService.register();

    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: 'view_value_panel',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          return typeof context.data.actions.valuePresentationId === 'string';
        },
        order: 0.5,
        title: 'data_grid_table_open_value_panel',
        icon: 'value-panel',
        onClick(context) {
          context.data.actions.setValuePresentation('');
        },
      }
    );
  }

  load(): void | Promise<void> { }
}
