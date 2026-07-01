/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExceptionsCatcherService } from '@cloudbeaver/core-events';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { ACTION_OPEN, ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_ACTIONS,
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION_ACTIONS,
  DATA_CONTEXT_DV_RESULT_KEY,
  DATA_CONTEXT_DV_SIMPLE,
  DatabaseDataFeature,
  DataPresentationService,
  IDatabaseDataConstraintAction,
  IDatabaseDataSelectAction,
  type IGridDataKey,
  isResultSetDataSource,
  MENU_DV_CONTEXT_MENU,
} from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuCellEditingService } from './DataGrid/DataGridContextMenu/DataGridContextMenuCellEditingService.js';
import { DataGridContextMenuFilterService } from './DataGrid/DataGridContextMenu/DataGridContextMenuFilter/DataGridContextMenuFilterService.js';
import { DataGridContextMenuOrderService } from './DataGrid/DataGridContextMenu/DataGridContextMenuOrderService.js';
import { DataGridContextMenuSaveContentService } from './DataGrid/DataGridContextMenu/DataGridContextMenuSaveContentService.js';
import { DataGridContextMenuGenerateSqlService } from './DataGrid/DataGridContextMenu/DataGridContextMenuGenerateSqlService.js';
import { DataGridSettingsService } from './DataGridSettingsService.js';
import { ACTION_DATA_GRID_PIN_COLUMN } from './DataGrid/Actions/Pin/ACTION_DATA_GRID_PIN_COLUMN.js';
import { ACTION_DATA_GRID_UNPIN_COLUMN } from './DataGrid/Actions/Pin/ACTION_DATA_GRID_UNPIN_COLUMN.js';
import { ACTION_DATA_GRID_UNPIN_ALL_COLUMNS } from './DataGrid/Actions/Pin/ACTION_DATA_GRID_UNPIN_ALL_COLUMNS.js';
import { ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING } from './DataGrid/Actions/Filters/ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING.js';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';

const VALUE_TEXT_PRESENTATION_ID = 'value-text-presentation';

const SpreadsheetGrid = importLazyComponent(() => import('./SpreadsheetGrid.js').then(m => m.SpreadsheetGrid));

@injectable(() => [
  DataPresentationService,
  DataGridSettingsService,
  DataGridContextMenuOrderService,
  DataGridContextMenuFilterService,
  DataGridContextMenuCellEditingService,
  DataGridContextMenuSaveContentService,
  DataGridContextMenuGenerateSqlService,
  ActionService,
  MenuService,
  ExceptionsCatcherService,
])
export class SpreadsheetBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataGridSettingsService: DataGridSettingsService,
    private readonly dataGridContextMenuSortingService: DataGridContextMenuOrderService,
    private readonly dataGridContextMenuFilterService: DataGridContextMenuFilterService,
    private readonly dataGridContextMenuCellEditingService: DataGridContextMenuCellEditingService,
    private readonly dataGridContextMenuSaveContentService: DataGridContextMenuSaveContentService,
    private readonly dataGridContextMenuGenerateSqlService: DataGridContextMenuGenerateSqlService,
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
      order: 0,
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
    this.dataGridContextMenuGenerateSqlService.register();

    this.menuService.addCreator({
      root: true,
      menus: [MENU_DV_CONTEXT_MENU],
      contexts: [DATA_CONTEXT_DV_SIMPLE, DATA_CONTEXT_DV_ACTIONS, DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      getItems: (context, items) => [
        ACTION_OPEN,
        ...items,
        ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING,
        ACTION_DATA_GRID_PIN_COLUMN,
        ACTION_DATA_GRID_UNPIN_COLUMN,
        ACTION_DATA_GRID_UNPIN_ALL_COLUMNS,
      ],
    });

    this.actionService.addHandler({
      id: 'data-grid-key-base-handler',
      menus: [MENU_DV_CONTEXT_MENU],
      contexts: [
        DATA_CONTEXT_DV_SIMPLE,
        DATA_CONTEXT_DV_ACTIONS,
        DATA_CONTEXT_DV_DDM,
        DATA_CONTEXT_DV_DDM_RESULT_INDEX,
        DATA_CONTEXT_DV_PRESENTATION_ACTIONS,
        DATA_CONTEXT_DV_RESULT_KEY,
      ],
      getActionInfo: (context, action) => {
        if (action === ACTION_OPEN) {
          return { ...action.info, label: 'data_grid_table_open_value_panel', icon: 'value-panel' };
        }

        if (action === ACTION_DATA_GRID_PIN_COLUMN || action === ACTION_DATA_GRID_UNPIN_COLUMN) {
          const model = context.get(DATA_CONTEXT_DV_DDM)!;
          const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
          const select = model.source.tryGetAction(resultIndex, IDatabaseDataSelectAction);
          const selectedElements = (select?.getActiveElements() || []) as IGridDataKey[];
          const uniqueColumns = new Set(selectedElements.map(e => e.column.index));
          const isMultiple = uniqueColumns.size > 1;

          if (action === ACTION_DATA_GRID_PIN_COLUMN) {
            const label = isMultiple ? 'plugin_data_spreadsheet_new_pin_columns' : 'plugin_data_spreadsheet_new_pin_column';
            return { ...action.info, label };
          }

          if (action === ACTION_DATA_GRID_UNPIN_COLUMN) {
            const label = isMultiple ? 'plugin_data_spreadsheet_new_unpin_columns' : 'plugin_data_spreadsheet_new_unpin_column';
            return { ...action.info, label };
          }
        }

        return action.info;
      },
      isHidden: (context, action) => {
        const dataContextResultKey = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;
        const presentationActions = context.get(DATA_CONTEXT_DV_PRESENTATION_ACTIONS)!;

        if (action === ACTION_DATA_GRID_PIN_COLUMN && dataContextResultKey) {
          return presentationActions.isColumnPinned(dataContextResultKey) === true;
        }

        if (action === ACTION_DATA_GRID_UNPIN_COLUMN && dataContextResultKey) {
          return presentationActions.isColumnPinned(dataContextResultKey) === false;
        }

        if (action === ACTION_DATA_GRID_UNPIN_ALL_COLUMNS) {
          return !presentationActions.hasPinnedColumns();
        }

        return false;
      },
      isActionApplicable: (context, action): boolean => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (action === ACTION_OPEN) {
          const actions = context.get(DATA_CONTEXT_DV_ACTIONS);
          const simple = context.get(DATA_CONTEXT_DV_SIMPLE);
          const select = model.source.tryGetAction(resultIndex, IDatabaseDataSelectAction);
          const hasSingleCellSelected = select?.getActiveElements().length === 1;

          return actions?.valuePresentationId !== VALUE_TEXT_PRESENTATION_ID && !simple && hasSingleCellSelected;
        }

        if (action === ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING) {
          if (!isResultSetDataSource(model.source) || model.source.hasFeature(DatabaseDataFeature.References)) {
            return false;
          }

          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
          return constraints.orderConstraints.length > 0 || constraints.filterConstraints.length > 0;
        }

        return [
          ACTION_OPEN,
          ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING,
          ACTION_DATA_GRID_PIN_COLUMN,
          ACTION_DATA_GRID_UNPIN_COLUMN,
          ACTION_DATA_GRID_UNPIN_ALL_COLUMNS,
        ].includes(action);
      },
      handler: async (context, action) => {
        if (action === ACTION_OPEN) {
          const actions = context.get(DATA_CONTEXT_DV_ACTIONS);

          if (actions) {
            actions.setValuePresentation(VALUE_TEXT_PRESENTATION_ID);
          }
        }

        if (action === ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING) {
          const model = context.get(DATA_CONTEXT_DV_DDM)!;
          const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);

          await model.request(() => {
            constraints.deleteData();
          });
        }

        if (action === ACTION_DATA_GRID_PIN_COLUMN) {
          const presentationActions = context.get(DATA_CONTEXT_DV_PRESENTATION_ACTIONS)!;
          handleColumnPinAction(context, columns => presentationActions.pinColumns(columns));
        }

        if (action === ACTION_DATA_GRID_UNPIN_COLUMN) {
          const presentationActions = context.get(DATA_CONTEXT_DV_PRESENTATION_ACTIONS)!;
          handleColumnPinAction(context, columns => presentationActions.unpinColumns(columns));
        }

        if (action === ACTION_DATA_GRID_UNPIN_ALL_COLUMNS) {
          const presentationActions = context.get(DATA_CONTEXT_DV_PRESENTATION_ACTIONS)!;
          presentationActions.unpinAllColumns();
        }
      },
    });
  }
}

function handleColumnPinAction(context: IDataContextProvider, action: (columns: IGridDataKey[]) => void) {
  const dataContextResultKey = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;
  const model = context.get(DATA_CONTEXT_DV_DDM)!;
  const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

  const select = model.source.tryGetAction(resultIndex, IDatabaseDataSelectAction);
  const selectedElements = (select?.getActiveElements() || []) as IGridDataKey[];
  const keys = selectedElements.length ? selectedElements : [dataContextResultKey];

  action(keys);
}
