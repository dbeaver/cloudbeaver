/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ClipboardService } from '@cloudbeaver/core-ui';
import { ActionService, getMenuLabelClipped, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_RESULT_KEY,
  IDatabaseDataConstraintAction,
  type IDatabaseDataModel,
  type IGridColumnKey,
  IS_NOT_NULL_ID,
  IS_NULL_ID,
  isFilterConstraint,
  isResultSetDataSource,
  nullOperationsFilter,
  IDatabaseDataResultAction,
  ResultSetDataSource,
  wrapOperationArgument,
  GridDataResultAction,
  ResultSetDataAction,
  IDatabaseDataFormatAction,
  IDatabaseDataViewAction,
  GridViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_GRID_FILTERS_RESET_ALL } from '../../Actions/Filters/ACTION_DATA_GRID_FILTERS_RESET_ALL.js';
import { MENU_DATA_GRID_FILTERS } from './MENU_DATA_GRID_FILTERS.js';
import { MENU_DATA_GRID_FILTERS_CELL_VALUE } from './MENU_DATA_GRID_FILTERS_CELL_VALUE.js';
import { MENU_DATA_GRID_FILTERS_CLIPBOARD } from './MENU_DATA_GRID_FILTERS_CLIPBOARD.js';
import { MENU_DATA_GRID_FILTERS_CUSTOM } from './MENU_DATA_GRID_FILTERS_CUSTOM.js';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN } from '../../Actions/Filters/ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN.js';
import { LocalizationService } from '@cloudbeaver/core-localization';

const FilterCustomValueDialog = importLazyComponent(() => import('./FilterCustomValueDialog.js').then(m => m.FilterCustomValueDialog));

@injectable(() => [CommonDialogService, ClipboardService, ActionService, MenuService, LocalizationService])
export class DataGridContextMenuFilterService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly clipboardService: ClipboardService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
  ) {}

  private async applyFilter(
    model: IDatabaseDataModel<ResultSetDataSource>,
    resultIndex: number,
    column: IGridColumnKey,
    operator: string,
    filterValue?: any,
  ) {
    if (model.isLoading() || model.isDisabled(resultIndex)) {
      return;
    }

    const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
    const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);
    // TODO: fix column abstraction
    const resultColumn = data.getColumn(column) as SqlResultColumn | undefined;

    if (!resultColumn) {
      throw new Error(`Failed to get result column info for the following column index: "${column.index}"`);
    }

    await model.request(() => {
      constraints.setFilter(resultColumn.position, operator, filterValue);
    });
  }

  register(): void {
    const localizationService = this.localizationService;
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (!isResultSetDataSource(model.source)) {
          return false;
        }

        const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
        return constraints.supported && !model.isDisabled(resultIndex);
      },
      getItems: (context, items) => [...items, MENU_DATA_GRID_FILTERS],
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_FILTERS],
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);
        const resultColumn = data.getColumn(key.column);

        const supportedOperations = data.getColumnOperations(key.column);
        const result = [];

        for (const filter of [IS_NULL_ID, IS_NOT_NULL_ID]) {
          const { clippedLabel } = getMenuLabelClipped(resultColumn?.label ?? '');
          const fullLabel = `${resultColumn ? `"${resultColumn.label}" ` : ''}${filter.split('_').join(' ')}`;
          const label = `${resultColumn ? `"${clippedLabel}" ` : ''}${filter.split('_').join(' ')}`;
          const tooltip = fullLabel !== label ? fullLabel : undefined;

          if (supportedOperations.some(operation => operation.id === filter)) {
            result.push(
              new MenuBaseItem(
                {
                  id: filter,
                  label,
                  tooltip,
                  icon: 'filter',
                },
                {
                  onSelect: async () => {
                    await this.applyFilter(model as unknown as IDatabaseDataModel<ResultSetDataSource>, resultIndex, key.column, filter);
                  },
                },
              ),
            );
          }
        }

        return [
          ...items,
          MENU_DATA_GRID_FILTERS_CELL_VALUE,
          MENU_DATA_GRID_FILTERS_CUSTOM,
          MENU_DATA_GRID_FILTERS_CLIPBOARD,
          ...result,
          ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN,
          ACTION_DATA_GRID_FILTERS_RESET_ALL,
        ];
      },
    });

    this.actionService.addHandler({
      id: 'data-grid-filters-base-handler',
      menus: [MENU_DATA_GRID_FILTERS],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isActionApplicable: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;

        if (!isResultSetDataSource(model.source)) {
          return false;
        }

        return [ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN, ACTION_DATA_GRID_FILTERS_RESET_ALL].includes(action);
      },
      isHidden: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);

        if (action === ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN) {
          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
          // TODO: fix column abstraction
          const resultColumn = data.getColumn(key.column) as SqlResultColumn | undefined;
          const currentConstraint = resultColumn ? constraints.get(resultColumn.position) : undefined;

          return !currentConstraint || !isFilterConstraint(currentConstraint);
        }

        if (action === ACTION_DATA_GRID_FILTERS_RESET_ALL) {
          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
          return constraints.filterConstraints.length === 0 && !model.requestInfo.requestFilter;
        }

        return true;
      },

      getActionInfo(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;
        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);
        // TODO: fix column abstraction
        const resultColumn = data.getColumn(key.column) as SqlResultColumn | undefined;

        if (action === ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN) {
          const columnName = resultColumn?.name ?? '';
          const { clippedLabel: clippedColumnName } = getMenuLabelClipped(columnName);
          const clippedLabel = localizationService.translate('data_grid_table_filter_delete_for_column', undefined, { column: clippedColumnName });
          const fullLabel = localizationService.translate('data_grid_table_filter_delete_for_column', undefined, { column: columnName });
          const tooltip = fullLabel !== clippedLabel ? fullLabel : undefined;

          return {
            ...action.info,
            label: clippedLabel,
            tooltip,
          };
        }

        return action.info;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);

        if (action === ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN) {
          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
          // TODO: fix column abstraction
          const resultColumn = data.getColumn(key.column) as SqlResultColumn | undefined;

          if (!resultColumn) {
            throw new Error(`Failed to get result column info for the following column index: "${key.column.index}"`);
          }

          await model.request(() => {
            constraints.deleteFilter(resultColumn.position);
          });
        }

        if (action === ACTION_DATA_GRID_FILTERS_RESET_ALL) {
          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);

          await model.request(() => {
            constraints.deleteDataFilters();
          });
        }
      },
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_FILTERS_CELL_VALUE],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);

        if (model.isDisabled(resultIndex)) {
          return false;
        }

        const supportedOperations = data.getColumnOperations(key.column);
        return supportedOperations.length > 0;
      },
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const format = model.source.getAction(resultIndex, IDatabaseDataFormatAction);
        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);

        const cellValue = format.getText(format.get(key));
        const supportedOperations = data.getColumnOperations(key.column);
        const columnLabel = data.getColumn(key.column)?.label || '';

        const filters = supportedOperations
          .filter(operation => !nullOperationsFilter(operation))
          .map(operation => {
            const wrappedValue = wrapOperationArgument(operation.id, cellValue);
            const { clippedLabel: clippedValue } = getMenuLabelClipped(wrappedValue);
            const fullLabel = `${columnLabel} ${operation.expression} ${wrappedValue}`;
            const tooltip = fullLabel !== clippedValue ? fullLabel : undefined;

            return new MenuBaseItem(
              {
                id: operation.id,
                label: clippedValue,
                icon: 'filter',
                tooltip,
              },
              {
                onSelect: async () => {
                  await this.applyFilter(
                    model as unknown as IDatabaseDataModel<ResultSetDataSource>,
                    resultIndex,
                    key.column,
                    operation.id,
                    wrappedValue,
                  );
                },
              },
            );
          });

        return [...items, ...filters];
      },
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_FILTERS_CUSTOM],
      isApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);
        const view = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);

        const supportedOperations = data.getColumnOperations(key.column);
        const cellHolder = view.getCellHolder(key);

        return cellHolder.value !== undefined && supportedOperations.length > 0;
      },
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);
        const format = model.source.getAction(resultIndex, IDatabaseDataFormatAction);

        const supportedOperations = data.getColumnOperations(key.column);
        const columnLabel = data.getColumn(key.column)?.label || '';
        const displayString = format.getText(format.get(key));

        const filters = supportedOperations
          .filter(operation => !nullOperationsFilter(operation))
          .map(operation => {
            const { clippedLabel: clippedColumnLabel } = getMenuLabelClipped(columnLabel);
            const fullLabel = `${columnLabel} ${operation.expression}..`;
            const label = `${clippedColumnLabel} ${operation.expression}..`;
            const tooltip = fullLabel !== label ? fullLabel : undefined;

            return new MenuBaseItem(
              {
                id: operation.id,
                label,
                tooltip,
                icon: 'filter-custom',
              },
              {
                onSelect: async () => {
                  const { status, result } = await this.commonDialogService.open(FilterCustomValueDialog, {
                    defaultValue: displayString,
                    inputTitle: label + ':',
                  });

                  if (status === DialogueStateResult.Resolved && result !== undefined) {
                    await this.applyFilter(
                      model as unknown as IDatabaseDataModel<ResultSetDataSource>,
                      resultIndex,
                      key.column,
                      operation.id,
                      result,
                    );
                  }
                },
              },
            );
          });

        return [...items, ...filters];
      },
    });

    this.menuService.setHandler({
      id: 'data-grid-filters-clipboard-handler',
      menus: [MENU_DATA_GRID_FILTERS_CLIPBOARD],
      handler: () => {
        if (this.clipboardService.state === 'granted') {
          this.clipboardService.read();
        }
      },
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_FILTERS_CLIPBOARD],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);
        const supportedOperations = data.getColumnOperations(key.column);

        return this.clipboardService.clipboardAvailable && this.clipboardService.state !== 'denied' && supportedOperations.length > 0;
      },
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, ResultSetDataAction);
        const supportedOperations = data.getColumnOperations(key.column);
        const columnLabel = data.getColumn(key.column)?.label || '';

        const result = [...items];

        if (this.clipboardService.state === 'prompt') {
          const permission = new MenuBaseItem(
            {
              id: 'permission',
              hidden: this.clipboardService.state !== 'prompt',
              label: 'data_grid_table_context_menu_filter_clipboard_permission',
              icon: 'permission',
            },
            {
              onSelect: async () => {
                await this.clipboardService.read();
              },
            },
            { isDisabled: () => model.isLoading() },
          );

          result.push(permission);
        }

        if (this.clipboardService.state === 'granted') {
          const filters = supportedOperations
            .filter(operation => !nullOperationsFilter(operation))
            .map(operation => {
              const val = this.clipboardService.clipboardValue || '';
              const wrappedValue = wrapOperationArgument(operation.id, val);
              const { clippedLabel: clippedValue } = getMenuLabelClipped(wrappedValue);
              const clippedLabel = `${columnLabel} ${operation.expression} ${clippedValue}`;
              const fullLabel = `${columnLabel} ${operation.expression} ${wrappedValue}`;
              const tooltip = fullLabel !== clippedLabel ? fullLabel : undefined;

              return new MenuBaseItem(
                { id: operation.id, icon: 'filter-clipboard', label: clippedLabel, tooltip },
                {
                  onSelect: async () => {
                    const wrappedValue = wrapOperationArgument(operation.id, val);

                    await this.applyFilter(
                      model as unknown as IDatabaseDataModel<ResultSetDataSource>,
                      resultIndex,
                      key.column,
                      operation.id,
                      wrappedValue,
                    );
                  },
                },
                { isDisabled: () => model.isLoading() },
              );
            });

          result.push(...filters);
        }

        return result;
      },
    });
  }
}
