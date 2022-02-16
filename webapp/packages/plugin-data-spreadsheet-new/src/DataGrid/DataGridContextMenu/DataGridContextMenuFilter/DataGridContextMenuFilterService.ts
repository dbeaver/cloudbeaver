/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, IContextMenuItem, IMenuContext, ComputedContextMenuModel } from '@cloudbeaver/core-dialogs';
import { ClipboardService } from '@cloudbeaver/core-ui';
import { replaceMiddle } from '@cloudbeaver/core-utils';
import {
  wrapOperationArgument,
  IDatabaseDataModel,
  nullOperationsFilter,
  ResultSetConstraintAction,
  IS_NOT_NULL_ID,
  IS_NULL_ID,
  ResultSetDataAction,
  IDatabaseResultSet,
  IDatabaseDataOptions,
  ResultSetFormatAction,
  isFilterConstraint,
  IResultSetColumnKey
} from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService, IDataGridCellMenuContext } from '../DataGridContextMenuService';
import { FilterCustomValueDialog } from './FilterCustomValueDialog';

@injectable()
export class DataGridContextMenuFilterService {
  private static readonly menuFilterToken = 'menuFilter';

  constructor(
    private readonly dataGridContextMenuService: DataGridContextMenuService,
    private readonly commonDialogService: CommonDialogService,
    private readonly clipboardService: ClipboardService,
  ) {
    this.dataGridContextMenuService.onRootMenuOpen.addHandler(this.getClipboardValue.bind(this));
  }

  getMenuFilterToken(): string {
    return DataGridContextMenuFilterService.menuFilterToken;
  }

  private async applyFilter(
    model: IDatabaseDataModel<IDatabaseDataOptions, IDatabaseResultSet>,
    resultIndex: number,
    column: IResultSetColumnKey,
    operator: string,
    filterValue?: any,
  ) {
    if (model.isLoading() || model.isDisabled(resultIndex)) {
      return;
    }

    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const resultColumn = data.getColumn(column);

    if (!resultColumn) {
      throw new Error(`Failed to get result column info for the following column index: "${column.index}"`);
    }

    await model.requestDataAction(async () => {
      constraints.setFilter(resultColumn.position, operator, filterValue);
      await model.request(true);
    });
  }

  private async getClipboardValue() {
    if (this.clipboardService.state === 'granted') {
      await this.clipboardService.read();
    }
  }

  private getGeneralizedMenuItems(
    context: IMenuContext<IDataGridCellMenuContext>,
    value: any | (() => any),
    icon: string,
    isHidden?: (context: IMenuContext<IDataGridCellMenuContext>) => boolean,
  ): Array<IContextMenuItem<IDataGridCellMenuContext>> {
    const { model, resultIndex, key } = context.data;
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const format = model.source.getAction(resultIndex, ResultSetFormatAction);
    const supportedOperations = data.getColumnOperations(key.column);
    const columnLabel = data.getColumn(key.column)?.label || '';

    return supportedOperations
      .filter(operation => !nullOperationsFilter(operation))
      .map(operation => ({
        id: operation.id,
        icon,
        isPresent: () => true,
        isDisabled(context) {
          return context.data.model.isLoading();
        },
        isHidden(context) {
          return isHidden?.(context) ?? false;
        },
        titleGetter() {
          const val = typeof value === 'function' ? value() : value;
          const stringifyValue = format.toDisplayString(val);
          const wrappedValue = wrapOperationArgument(operation.id, stringifyValue);
          const clippedValue = replaceMiddle(wrappedValue, ' ... ', 8, 30);
          return `${columnLabel} ${operation.expression} ${clippedValue}`;
        },
        onClick: async () => {
          const val = typeof value === 'function' ? value() : value;
          const wrappedValue = wrapOperationArgument(operation.id, val);
          await this.applyFilter(model, resultIndex, key.column, operation.id, wrappedValue);
        },
      }));
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: this.getMenuFilterToken(),
        order: 2,
        title: 'data_grid_table_filter',
        icon: 'filter',
        isPanel: true,
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          if (context.data.model.isDisabled(context.data.resultIndex)) {
            return true;
          }

          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          return !constraints.supported;
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: 'deleteFiltersAndOrders',
        order: 3,
        title: 'data_grid_table_delete_filters_and_orders',
        icon: 'erase',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          if (context.data.model.isDisabled(context.data.resultIndex)) {
            return true;
          }

          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          return (
            constraints.orderConstraints.length === 0
            && constraints.filterConstraints.length === 0
          );
        },
        onClick: async context => {
          const { model, resultIndex } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

          await model.requestDataAction(async () => {
            constraints.deleteData();
            await model.request(true);
          });
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'clipboardValue',
        order: 0,
        title: 'ui_clipboard',
        icon: 'filter-clipboard',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          if (!this.clipboardService.clipboardAvailable || this.clipboardService.state === 'denied') {
            return true;
          }

          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.key.column);

          return supportedOperations.length === 0;
        },
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'clipboardValuePanel',
          menuItemsGetter: context => {
            if (context.contextType !== DataGridContextMenuService.cellContext) {
              return [];
            }

            const valueGetter = () => this.clipboardService.clipboardValue || '';
            const items = this.getGeneralizedMenuItems(
              context,
              valueGetter,
              'filter-clipboard',
              () => this.clipboardService.state === 'prompt'
            );

            return [
              {
                id: 'permission',
                isPresent: () => true,
                isHidden: () => this.clipboardService.state !== 'prompt',
                isDisabled(context) {
                  return context.data.model.isLoading();
                },
                title: 'data_grid_table_context_menu_filter_clipboard_permission',
                icon: 'permission',
                onClick: async () => {
                  await this.clipboardService.read();
                },
              },
              ...items,
            ];
          },
        }),
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'cellValue',
        order: 1,
        title: 'data_grid_table_filter_cell_value',
        icon: 'filter',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex, key } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const format = model.source.getAction(resultIndex, ResultSetFormatAction);
          const supportedOperations = data.getColumnOperations(key.column);
          const value = data.getCellValue(key);

          return value === undefined || supportedOperations.length === 0 || format.isNull(value);
        },
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'cellValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, key } = context.data;
            const data = model.source.getAction(resultIndex, ResultSetDataAction);
            const cellValue = data.getCellValue(key);
            const items = this.getGeneralizedMenuItems(context, cellValue, 'filter');
            return items;
          },
        }),
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'customValue',
        order: 2,
        title: 'data_grid_table_filter_custom_value',
        icon: 'filter-custom',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex, key } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const cellValue = data.getCellValue(key);
          const supportedOperations = data.getColumnOperations(key.column);

          return cellValue === undefined || supportedOperations.length === 0;
        },
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'customValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, key } = context.data;
            const format = model.source.getAction(resultIndex, ResultSetFormatAction);
            const data = model.source.getAction(resultIndex, ResultSetDataAction);
            const supportedOperations = data.getColumnOperations(key.column);
            const cellValue = data.getCellValue(key) ?? '';
            const columnLabel = data.getColumn(key.column)?.label || '';

            return supportedOperations
              .filter(operation => !nullOperationsFilter(operation))
              .map(operation => {
                const title = `${columnLabel} ${operation.expression}`;

                return {
                  id: operation.id,
                  isPresent: () => true,
                  isDisabled(context) {
                    return context.data.model.isLoading();
                  },
                  title: title + ' ..',
                  icon: 'filter-custom',
                  onClick: async () => {
                    const stringifyCellValue = format.toDisplayString(cellValue);
                    const customValue = await this.commonDialogService.open(
                      FilterCustomValueDialog,
                      {
                        defaultValue: stringifyCellValue,
                        inputTitle: title + ':',
                      }
                    );

                    if (customValue === DialogueStateResult.Rejected || customValue === DialogueStateResult.Resolved) {
                      return;
                    }

                    await this.applyFilter(
                      model,
                      resultIndex,
                      key.column,
                      operation.id,
                      customValue
                    );
                  },
                };
              });
          },
        }),
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'isNullValue',
        order: 3,
        icon: 'filter',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.key.column);

          return !supportedOperations.some(operation => operation.id === IS_NULL_ID);
        },
        titleGetter: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(context.data.key.column)?.label || '';
          return `${columnLabel} IS NULL`;
        },
        onClick: async context => {
          await this.applyFilter(context.data.model, context.data.resultIndex, context.data.key.column, IS_NULL_ID);
        },

      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'isNotNullValue',
        order: 4,
        icon: 'filter',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.key.column);

          return !supportedOperations.some(operation => operation.id === IS_NOT_NULL_ID);
        },
        titleGetter: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(context.data.key.column)?.label || '';
          return `${columnLabel} IS NOT NULL`;
        },
        onClick: async context => {
          await this.applyFilter(context.data.model, context.data.resultIndex, context.data.key.column, IS_NOT_NULL_ID);
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'deleteFilter',
        order: 5,
        icon: 'filter-reset',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex, key } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const resultColumn = data.getColumn(key.column);
          const currentConstraint = resultColumn ? constraints.get(resultColumn.position) : undefined;

          return !currentConstraint || !isFilterConstraint(currentConstraint);
        },
        titleGetter: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(context.data.key.column)?.name || '';
          return `Delete filter for ${columnLabel}`;
        },
        onClick: async context => {
          const { model, resultIndex, key } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const resultColumn = data.getColumn(key.column);

          if (!resultColumn) {
            throw new Error(`Failed to get result column info for the following column index: "${key.column.index}"`);
          }

          await model.requestDataAction(async () => {
            constraints.deleteFilter(resultColumn.position);
            await model.request(true);
          });
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'deleteAllFilters',
        order: 6,
        icon: 'filter-reset-all',
        title: 'data_grid_table_filter_reset_all_filters',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

          return constraints.filterConstraints.length === 0 && !model.requestInfo.requestFilter;
        },
        onClick: async context => {
          const { model, resultIndex } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

          await model.requestDataAction(async () => {
            constraints.deleteDataFilters();
            await model.request(true);
          });
        },
      }
    );
  }
}
