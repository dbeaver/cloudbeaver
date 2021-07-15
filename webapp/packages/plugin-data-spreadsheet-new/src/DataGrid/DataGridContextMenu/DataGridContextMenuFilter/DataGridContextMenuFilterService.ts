/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, IContextMenuItem, IMenuContext } from '@cloudbeaver/core-dialogs';
import { ComputedContextMenuModel } from '@cloudbeaver/core-dialogs';
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
  isFilterConstraint
} from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService, IDataGridCellMenuContext } from '../DataGridContextMenuService';
import { FilterCustomValueDialog } from './FilterCustomValueDialog';

@injectable()
export class DataGridContextMenuFilterService {
  private static menuFilterToken = 'menuFilter';

  constructor(
    private dataGridContextMenuService: DataGridContextMenuService,
    private commonDialogService: CommonDialogService,
    private clipboardService: ClipboardService,
  ) {
    this.dataGridContextMenuService.onRootMenuOpen.addHandler(this.getClipboardValue.bind(this));
  }

  getMenuFilterToken(): string {
    return DataGridContextMenuFilterService.menuFilterToken;
  }

  private async applyFilter(
    model: IDatabaseDataModel<IDatabaseDataOptions, IDatabaseResultSet>,
    resultIndex: number,
    columnIndex: number,
    operator: string,
    filterValue?: any,
  ) {
    if (model.isLoading() || model.isDisabled(resultIndex)) {
      return;
    }

    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const columnLabel = data.getColumn(columnIndex)?.label || '';

    constraints.setFilter(columnLabel, operator, filterValue);
    await model.refresh();
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
    const { model, resultIndex, column } = context.data;
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const format = model.source.getAction(resultIndex, ResultSetFormatAction);
    const supportedOperations = data.getColumnOperations(column);
    const columnLabel = data.getColumn(column)?.label || '';

    return supportedOperations
      .filter(operation => !nullOperationsFilter(operation))
      .map(operation => ({
        id: operation.id,
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
        icon,
        onClick: async () => {
          const val = typeof value === 'function' ? value() : value;
          const wrappedValue = wrapOperationArgument(operation.id, val);
          await this.applyFilter(model, resultIndex, column, operation.id, wrappedValue);
        },
      }));
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: this.getMenuFilterToken(),
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          return context.data.model.isDisabled(context.data.resultIndex)
            || context.data.model.source.results.length > 1;
        },
        order: 2,
        title: 'data_grid_table_filter',
        icon: 'filter',
        isPanel: true,
      }
    );
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: 'deleteFiltersAndOrders',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          return constraints.orderConstraints.length === 0 && constraints.filterConstraints.length === 0;
        },
        order: 3,
        title: 'data_grid_table_delete_filters_and_orders',
        icon: 'erase',
        onClick: async context => {
          const { model, resultIndex } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

          constraints.deleteData();
          await model.refresh();
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'clipboardValue',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          if (!this.clipboardService.clipboardAvailable || this.clipboardService.state === 'denied') {
            return true;
          }

          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.column);

          return supportedOperations.length === 0;
        },
        order: 0,
        title: 'ui_clipboard',
        icon: 'filter-clipboard',
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
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex, column, row } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const format = model.source.getAction(resultIndex, ResultSetFormatAction);
          const supportedOperations = data.getColumnOperations(column);

          return supportedOperations.length === 0 || format.isNull(data.getCellValue({ column, row }));
        },
        order: 1,
        title: 'data_grid_table_filter_cell_value',
        icon: 'filter',
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'cellValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, column, row } = context.data;
            const data = model.source.getAction(resultIndex, ResultSetDataAction);
            const cellValue = data.getCellValue({ column, row });
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
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.column);

          return supportedOperations.length === 0;
        },
        order: 2,
        title: 'data_grid_table_filter_custom_value',
        icon: 'filter-custom',
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'customValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, column, row } = context.data;
            const format = model.source.getAction(resultIndex, ResultSetFormatAction);
            const data = model.source.getAction(resultIndex, ResultSetDataAction);
            const supportedOperations = data.getColumnOperations(column);
            const cellValue = data.getCellValue({ column, row });
            const columnLabel = data.getColumn(column)?.label || '';

            return supportedOperations
              .filter(operation => !nullOperationsFilter(operation))
              .map(operation => {
                const title = `${columnLabel} ${operation.expression}`;

                return {
                  id: operation.id,
                  isPresent(context) {
                    return context.contextType === DataGridContextMenuService.cellContext;
                  },
                  isDisabled(context) {
                    return context.data.model.isLoading();
                  },
                  title: title + ' ..',
                  icon: 'filter-custom',
                  onClick: async () => {
                    const isNull = format.isNull(cellValue);
                    const stringifyCellValue = format.toDisplayString(cellValue);
                    const customValue = await this.commonDialogService.open(
                      FilterCustomValueDialog,
                      {
                        defaultValue: isNull ? '' : stringifyCellValue,
                        inputTitle: title + ':',
                      }
                    );

                    if (customValue === DialogueStateResult.Rejected || customValue === DialogueStateResult.Resolved) {
                      return;
                    }

                    await this.applyFilter(
                      model,
                      resultIndex,
                      column,
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
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.column);

          return !supportedOperations.some(operation => operation.id === IS_NULL_ID);
        },
        order: 3,
        icon: 'filter',
        titleGetter: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(context.data.column)?.label || '';
          return `${columnLabel} IS NULL`;
        },
        onClick: async context => {
          await this.applyFilter(context.data.model, context.data.resultIndex, context.data.column, IS_NULL_ID);
        },

      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'isNotNullValue',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const supportedOperations = data.getColumnOperations(context.data.column);

          return !supportedOperations.some(operation => operation.id === IS_NOT_NULL_ID);
        },
        order: 4,
        icon: 'filter',
        titleGetter: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(context.data.column)?.label || '';
          return `${columnLabel} IS NOT NULL`;
        },
        onClick: async context => {
          await this.applyFilter(context.data.model, context.data.resultIndex, context.data.column, IS_NOT_NULL_ID);
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'deleteFilter',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex, column } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const data = model.source.getAction(resultIndex, ResultSetDataAction);

          const columnLabel = data.getColumn(column)?.label || '';
          const currentConstraint = constraints.get(columnLabel);

          return !currentConstraint || !isFilterConstraint(currentConstraint);
        },
        order: 5,
        icon: 'filter-reset',
        titleGetter: context => {
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(context.data.column)?.name || '';
          return `Delete filter for ${columnLabel}`;
        },
        onClick: async context => {
          const { model, resultIndex, column } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const columnLabel = data.getColumn(column)?.label || '';

          constraints.deleteFilter(columnLabel);
          await model.refresh();
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'deleteAllFilters',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const { model, resultIndex } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

          return constraints.filterConstraints.length === 0 && !model.requestInfo.requestFilter;
        },
        order: 6,
        icon: 'filter-reset-all',
        title: 'data_grid_table_filter_reset_all_filters',
        onClick: async context => {
          const { model, resultIndex } = context.data;
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

          constraints.deleteDataFilters();
          await model.refresh();
        },
      }
    );
  }
}
