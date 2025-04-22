/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ClipboardService } from '@cloudbeaver/core-ui';
import { replaceMiddle } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { ACTION_DELETE, ActionService, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_RESULT_KEY,
  DatabaseDataConstraintAction,
  type IDatabaseDataModel,
  type IResultSetColumnKey,
  IS_NOT_NULL_ID,
  IS_NULL_ID,
  isFilterConstraint,
  isResultSetDataSource,
  nullOperationsFilter,
  ResultSetDataAction,
  ResultSetDataSource,
  ResultSetFormatAction,
  wrapOperationArgument,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_GRID_FILTERS_RESET_ALL } from '../../Actions/Filters/ACTION_DATA_GRID_FILTERS_RESET_ALL.js';
import { MENU_DATA_GRID_FILTERS } from './MENU_DATA_GRID_FILTERS.js';
import { MENU_DATA_GRID_FILTERS_CELL_VALUE } from './MENU_DATA_GRID_FILTERS_CELL_VALUE.js';
import { MENU_DATA_GRID_FILTERS_CLIPBOARD } from './MENU_DATA_GRID_FILTERS_CLIPBOARD.js';
import { MENU_DATA_GRID_FILTERS_CUSTOM } from './MENU_DATA_GRID_FILTERS_CUSTOM.js';

const FilterCustomValueDialog = importLazyComponent(() => import('./FilterCustomValueDialog.js').then(m => m.FilterCustomValueDialog));

@injectable()
export class DataGridContextMenuFilterService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly clipboardService: ClipboardService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  private async applyFilter(
    model: IDatabaseDataModel<ResultSetDataSource>,
    resultIndex: number,
    column: IResultSetColumnKey,
    operator: string,
    filterValue?: any,
  ) {
    if (model.isLoading() || model.isDisabled(resultIndex)) {
      return;
    }

    const constraints = model.source.getAction(resultIndex, DatabaseDataConstraintAction);
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const resultColumn = data.getColumn(column);

    if (!resultColumn) {
      throw new Error(`Failed to get result column info for the following column index: "${column.index}"`);
    }

    await model.request(() => {
      constraints.setFilter(resultColumn.position, operator, filterValue);
    });

    const whereFilter = model.requestInfo.requestFilter || model.source.options?.whereFilter;

    if (isNotNullDefined(whereFilter)) {
      constraints.setWhereFilter(whereFilter);
    }
  }

  register(): void {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        const source = model.source as unknown as ResultSetDataSource;

        if (!isResultSetDataSource(source)) {
          return false;
        }

        const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
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

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);
        const resultColumn = data.getColumn(key.column);

        const supportedOperations = data.getColumnOperations(key.column);
        const result = [];

        for (const filter of [IS_NULL_ID, IS_NOT_NULL_ID]) {
          const label = `${resultColumn ? `"${resultColumn.label}" ` : ''}${filter.split('_').join(' ')}`;

          if (supportedOperations.some(operation => operation.id === filter)) {
            result.push(
              new MenuBaseItem(
                {
                  id: filter,
                  label,
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
          ACTION_DELETE,
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

        return [ACTION_DELETE, ACTION_DATA_GRID_FILTERS_RESET_ALL].includes(action);
      },
      isHidden: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);

        if (action === ACTION_DELETE) {
          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
          const resultColumn = data.getColumn(key.column);
          const currentConstraint = resultColumn ? constraints.get(resultColumn.position) : undefined;

          return !currentConstraint || !isFilterConstraint(currentConstraint);
        }

        if (action === ACTION_DATA_GRID_FILTERS_RESET_ALL) {
          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
          return constraints.filterConstraints.length === 0 && !model.requestInfo.requestFilter;
        }

        return true;
      },

      getActionInfo(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);
        const resultColumn = data.getColumn(key.column);

        if (action === ACTION_DELETE) {
          return {
            ...action.info,
            icon: 'filter-reset',
            label: `Delete filter for "${resultColumn?.name ?? '?'}"`,
          };
        }

        return action.info;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);

        if (action === ACTION_DELETE) {
          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
          const resultColumn = data.getColumn(key.column);

          if (!resultColumn) {
            throw new Error(`Failed to get result column info for the following column index: "${key.column.index}"`);
          }

          await model.request(() => {
            constraints.deleteFilter(resultColumn.position);
          });
        }

        if (action === ACTION_DATA_GRID_FILTERS_RESET_ALL) {
          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);

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

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);

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

        const source = model.source as unknown as ResultSetDataSource;
        const format = source.getAction(resultIndex, ResultSetFormatAction);
        const data = source.getAction(resultIndex, ResultSetDataAction);

        const cellValue = format.getText(key);
        const supportedOperations = data.getColumnOperations(key.column);
        const columnLabel = data.getColumn(key.column)?.label || '';

        const filters = supportedOperations
          .filter(operation => !nullOperationsFilter(operation))
          .map(operation => {
            const wrappedValue = wrapOperationArgument(operation.id, cellValue);
            const clippedValue = replaceMiddle(wrappedValue, ' ... ', 8, 30);

            return new MenuBaseItem(
              {
                id: operation.id,
                label: `${columnLabel} ${operation.expression} ${clippedValue}`,
                icon: 'filter',
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

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);

        const supportedOperations = data.getColumnOperations(key.column);
        const cellValue = data.getCellValue(key);

        return cellValue !== undefined && supportedOperations.length > 0;
      },
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);
        const format = source.getAction(resultIndex, ResultSetFormatAction);

        const supportedOperations = data.getColumnOperations(key.column);
        const columnLabel = data.getColumn(key.column)?.label || '';
        const displayString = format.getText(key);

        const filters = supportedOperations
          .filter(operation => !nullOperationsFilter(operation))
          .map(operation => {
            const title = `${columnLabel} ${operation.expression}`;

            return new MenuBaseItem(
              {
                id: operation.id,
                label: title + ' ..',
                icon: 'filter-custom',
              },
              {
                onSelect: async () => {
                  const customValue = await this.commonDialogService.open(FilterCustomValueDialog, {
                    defaultValue: displayString,
                    inputTitle: title + ':',
                  });

                  if (customValue === DialogueStateResult.Rejected || customValue === DialogueStateResult.Resolved) {
                    return;
                  }

                  await this.applyFilter(
                    model as unknown as IDatabaseDataModel<ResultSetDataSource>,
                    resultIndex,
                    key.column,
                    operation.id,
                    customValue,
                  );
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

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);
        const supportedOperations = data.getColumnOperations(key.column);

        return this.clipboardService.clipboardAvailable && this.clipboardService.state !== 'denied' && supportedOperations.length > 0;
      },
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);
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
              const clippedValue = replaceMiddle(wrappedValue, ' ... ', 8, 30);
              const label = `${columnLabel} ${operation.expression} ${clippedValue}`;

              return new MenuBaseItem(
                { id: operation.id, icon: 'filter-clipboard', label },
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
