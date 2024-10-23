/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExceptionsCatcherService } from '@cloudbeaver/core-events';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService, DataViewerContextMenuService } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService.js';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService.js';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService.js';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService.js';
import { DataGridSettingsService } from './DataGridSettingsService.js';

const SpreadsheetGrid = importLazyComponent(() => import('./SpreadsheetGrid.js').then(m => m.SpreadsheetGrid));

@injectable()
export class SpreadsheetBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataGridSettingsService: DataGridSettingsService,
    private readonly dataGridContextMenuSortingService: DataGridContextMenuOrderService,
    private readonly dataGridContextMenuFilterService: DataGridContextMenuFilterService,
    private readonly dataGridContextMenuCellEditingService: DataGridContextMenuCellEditingService,
    private readonly dataViewerContextMenuService: DataViewerContextMenuService,
    private readonly dataGridContextMenuSaveContentService: DataGridContextMenuSaveContentService,
    exceptionsCatcherService: ExceptionsCatcherService,
  ) {
    super();
    exceptionsCatcherService.ignore('ResizeObserver loop completed with undelivered notifications.'); // Produces by react-data-grid
  }

  override register(): void | Promise<void> {
    this.dataPresentationService.add({
      id: 'spreadsheet_grid',
      dataFormat: ResultDataFormat.Resultset,
      getPresentationComponent: () => SpreadsheetGrid,
      hidden: () => this.dataGridSettingsService.hidden,
      title: 'Table',
      icon: 'table-icon-sm',
    });
    this.dataGridContextMenuSortingService.register();
    this.dataGridContextMenuFilterService.register();
    this.dataGridContextMenuCellEditingService.register();
    this.dataGridContextMenuSaveContentService.register();

    this.dataViewerContextMenuService.add(this.dataViewerContextMenuService.getMenuToken(), {
      id: 'view_value_panel',
      isPresent(context) {
        return context.contextType === DataViewerContextMenuService.cellContext;
      },
      isHidden(context) {
        return context.data.actions.valuePresentationId === 'value-text-presentation' || context.data.simple;
      },
      order: 0.5,
      title: 'data_grid_table_open_value_panel',
      icon: 'value-panel',
      onClick(context) {
        context.data.actions.setValuePresentation('value-text-presentation');
      },
    });
  }
}
