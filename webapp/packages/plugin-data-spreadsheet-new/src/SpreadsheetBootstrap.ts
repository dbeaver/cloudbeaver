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
import { ACTION_DELETE, ACTION_OPEN, ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_ACTIONS,
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_SIMPLE,
  DatabaseDataConstraintAction,
  DataPresentationService,
  isResultSetDataSource,
  MENU_DV_CONTEXT_MENU,
  ResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService.js';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService.js';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService.js';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService.js';
import { DataGridSettingsService } from './DataGridSettingsService.js';

const VALUE_TEXT_PRESENTATION_ID = 'value-text-presentation';

const SpreadsheetGrid = importLazyComponent(() => import('./SpreadsheetGrid.js').then(m => m.SpreadsheetGrid));

@injectable()
export class SpreadsheetBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataGridSettingsService: DataGridSettingsService,
    private readonly dataGridContextMenuSortingService: DataGridContextMenuOrderService,
    private readonly dataGridContextMenuFilterService: DataGridContextMenuFilterService,
    private readonly dataGridContextMenuCellEditingService: DataGridContextMenuCellEditingService,
    private readonly dataGridContextMenuSaveContentService: DataGridContextMenuSaveContentService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
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

    this.menuService.addCreator({
      root: true,
      menus: [MENU_DV_CONTEXT_MENU],
      contexts: [DATA_CONTEXT_DV_SIMPLE, DATA_CONTEXT_DV_ACTIONS, DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      getItems: (context, items) => [ACTION_OPEN, ...items, ACTION_DELETE],
    });

    this.actionService.addHandler({
      id: 'data-grid-key-base-handler',
      menus: [MENU_DV_CONTEXT_MENU],
      contexts: [DATA_CONTEXT_DV_SIMPLE, DATA_CONTEXT_DV_ACTIONS, DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      getActionInfo: (context, action) => {
        if (action === ACTION_OPEN) {
          return { ...action.info, label: 'data_grid_table_open_value_panel', icon: 'value-panel' };
        }

        if (action === ACTION_DELETE) {
          return { ...action.info, label: 'data_grid_table_delete_filters_and_orders', icon: 'erase' };
        }

        return action.info;
      },
      isActionApplicable: (context, action): boolean => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (action === ACTION_OPEN) {
          const actions = context.get(DATA_CONTEXT_DV_ACTIONS);
          const simple = context.get(DATA_CONTEXT_DV_SIMPLE);

          return actions?.valuePresentationId !== VALUE_TEXT_PRESENTATION_ID && !simple;
        }

        if (action === ACTION_DELETE) {
          const source = model.source as unknown as ResultSetDataSource;

          if (!isResultSetDataSource(model.source)) {
            return false;
          }

          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
          return constraints.orderConstraints.length > 0 || constraints.filterConstraints.length > 0;
        }

        return [ACTION_OPEN, ACTION_DELETE].includes(action);
      },
      handler: async (context, action) => {
        if (action === ACTION_OPEN) {
          const actions = context.get(DATA_CONTEXT_DV_ACTIONS);

          if (actions) {
            actions.setValuePresentation(VALUE_TEXT_PRESENTATION_ID);
          }
        }

        if (action === ACTION_DELETE) {
          const model = context.get(DATA_CONTEXT_DV_DDM)!;
          const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

          const source = model.source as unknown as ResultSetDataSource;
          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);

          await model.request(() => {
            constraints.deleteData();
          });
        }
      },
    });
  }
}
