/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ContextMenuService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ComputedContextMenuModel } from '@cloudbeaver/core-dialogs';
import { ClipboardService, replaceMiddle } from '@cloudbeaver/core-utils';
import {
  getOperationWrappedValue,
  IDatabaseDataModel,
  operationsWithNullFilter,
  ResultSetConstraintAction,
  IS_NOT_NULL_ID,
  IS_NULL_ID,
  ResultSetDataAction,
  supportedOperationsFilter,
  IDatabaseResultSet,
  IDatabaseDataOptions,
  ResultSetFormatAction
} from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService, IDataGridCellMenuContext } from '../DataGridContextMenuService';
import { FilterCustomValueDialog } from './FilterCustomValueDialog';

@injectable()
export class DataGridContextMenuFilterService {
  private static menuFilterToken = 'menuFilter';

  constructor(
    private dataGridContextMenuService: DataGridContextMenuService,
    private contextMenuService: ContextMenuService,
    private commonDialogService: CommonDialogService,
    private clipboardService: ClipboardService,
  ) {
    this.dataGridContextMenuService.onRootMenuOpen.addHandler(this.getClipboardValue.bind(this));
  }

  getMenuFilterToken(): string {
    return DataGridContextMenuFilterService.menuFilterToken;
  }

  private getCellValue(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number, rowIndex: number) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    return data.getCellValue({ column: columnIndex, row: rowIndex });
  }

  private toString(model: IDatabaseDataModel<any>, resultIndex: number, value: any) {
    const format = model.source.getAction(resultIndex, ResultSetFormatAction);
    return format.toString(value);
  }

  private isNull(model: IDatabaseDataModel<any>, resultIndex: number, value: any) {
    const format = model.source.getAction(resultIndex, ResultSetFormatAction);
    return format.isNull(value);
  }

  private getColumnName(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    return data.getColumn(columnIndex)?.name;
  }

  private getColumnSupportedOperations(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    return data.getColumn(columnIndex)?.supportedOperations.filter(supportedOperationsFilter) || [];
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
    const columnName = this.getColumnName(model, resultIndex, columnIndex) || '';

    constraints.setFilter(columnName, operator, filterValue);

    try {
      await model.refresh();
      if (model.requestInfo.requestFilter && model.source.options?.whereFilter) {
        model.source.options.whereFilter = '';
      }
    } catch {
      constraints.deleteFilter(columnName);
    }
  }

  private getFilter(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    const columnName = this.getColumnName(model, resultIndex, columnIndex) || '';

    return constraints.getFilter(columnName);
  }

  private getFilters(model: IDatabaseDataModel<any>, resultIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

    return constraints.getFilterConstraints();
  }

  private async deleteFilter(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    const columnName = this.getColumnName(model, resultIndex, columnIndex) || '';

    constraints.deleteFilter(columnName);
    await model.refresh();
  }

  private async deleteFilters(model: IDatabaseDataModel<any>, resultIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

    constraints.deleteFiltersFromConstraints();
    model.source.options.whereFilter = '';
    await model.refresh();
  }

  private async deleteAllConstraints(model: IDatabaseDataModel<any>, resultIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

    constraints.deleteAllConstraints();
    model.source.options.whereFilter = '';
    await model.refresh();
  }

  private async getClipboardValue() {
    if (this.clipboardService.state && (this.clipboardService.state === 'denied' || this.clipboardService.state === 'prompt')) {
      return;
    }

    await this.clipboardService.read();
  }

  private async getCustomValue(inputTitle: string, defaultValue: string) {
    const customValue = await this.commonDialogService.open(FilterCustomValueDialog, { defaultValue, inputTitle });

    if (customValue === DialogueStateResult.Rejected || customValue === DialogueStateResult.Resolved) {
      return;
    }

    return customValue;
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.contextMenuService.getRootMenuToken(),
      {
        id: this.getMenuFilterToken(),
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          return context.data.model.isDisabled(context.data.resultIndex)
            || context.data.model.source.results.length > 1;
        },
        order: 1,
        title: 'data_grid_table_filter',
        icon: '/icons/filter.png',
        isPanel: true,
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
          const supportedOperations = this.getColumnSupportedOperations(
            context.data.model,
            context.data.resultIndex,
            context.data.column
          );

          return !this.clipboardService.clipboardAvailable || supportedOperations.length === 0;
        },
        order: 0,
        title: 'ui_clipboard',
        icon: '/icons/filter_clipboard.png',
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'clipboardValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, column } = context.data;
            const supportedOperations = this.getColumnSupportedOperations(model, resultIndex, column);
            const columnName = this.getColumnName(model, resultIndex, column) || '';

            if (!this.clipboardService.state || this.clipboardService.state === 'denied' || this.clipboardService.state === 'prompt') {
              return [{
                id: 'permission',
                isPresent(context) {
                  return context.contextType === DataGridContextMenuService.cellContext;
                },
                isDisabled(context) {
                  return context.data.model.isLoading();
                },
                title: 'data_grid_table_context_menu_filter_clipboard_permission',
                icon: '/icons/permissions.png',
                onClick: async () => {
                  await this.clipboardService.read();
                },
              }];
            }

            return supportedOperations
              .filter(operation => !operationsWithNullFilter(operation))
              .map(operation => ({
                id: operation.id,
                isPresent(context) {
                  return context.contextType === DataGridContextMenuService.cellContext;
                },
                isDisabled(context) {
                  return context.data.model.isLoading();
                },
                titleGetter: () => {
                  const clipboardValue = getOperationWrappedValue(this.clipboardService.clipboardValue || '', operation.id);
                  const clippedClipboardValue = replaceMiddle(clipboardValue, ' ... ', 8, 30);
                  return `${columnName} ${operation.expression} ${clippedClipboardValue}`;
                },
                icon: '/icons/filter_clipboard.png',
                onClick: async () => {
                  await this.applyFilter(model, resultIndex, column, operation.id, this.clipboardService.clipboardValue || '');
                },
              }));
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
          const supportedOperations = this.getColumnSupportedOperations(
            model,
            resultIndex,
            column
          );
          const cellValue = this.getCellValue(model, resultIndex, column, row);

          return supportedOperations.length === 0 || this.isNull(model, resultIndex, cellValue);
        },
        order: 1,
        title: 'data_grid_table_filter_cell_value',
        icon: '/icons/filter_value.png',
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'cellValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, column, row } = context.data;
            const supportedOperations = this.getColumnSupportedOperations(model, resultIndex, column);
            const cellValue = this.getCellValue(model, resultIndex, column, row);
            const columnName = this.getColumnName(model, resultIndex, column) || '';

            return supportedOperations
              .filter(operation => !operationsWithNullFilter(operation))
              .map(operation => {
                const stringCellValue = this.toString(model, resultIndex, cellValue);
                const wrappedCellValue = getOperationWrappedValue(stringCellValue, operation.id);
                const clippedCellValue = replaceMiddle(wrappedCellValue, ' ... ', 8, 30);
                const title = `${columnName} ${operation.expression} ${clippedCellValue}`;

                return {
                  id: operation.id,
                  isPresent(context) {
                    return context.contextType === DataGridContextMenuService.cellContext;
                  },
                  isDisabled(context) {
                    return context.data.model.isLoading();
                  },
                  title,
                  icon: '/icons/filter_value.png',
                  onClick: async () => {
                    await this.applyFilter(model, resultIndex, column, operation.id, cellValue);
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
        id: 'customValue',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const supportedOperations = this.getColumnSupportedOperations(
            context.data.model,
            context.data.resultIndex,
            context.data.column
          );

          return supportedOperations.length === 0;
        },
        order: 2,
        title: 'data_grid_table_filter_custom_value',
        icon: '/icons/filter_custom.png',
        separator: true,
        panel: new ComputedContextMenuModel<IDataGridCellMenuContext>({
          id: 'customValuePanel',
          menuItemsGetter: context => {
            const { model, resultIndex, column, row } = context.data;
            const supportedOperations = this.getColumnSupportedOperations(model, resultIndex, column);
            const cellValue = this.getCellValue(model, resultIndex, column, row);
            const columnName = this.getColumnName(model, resultIndex, column) || '';

            return supportedOperations
              .filter(operation => !operationsWithNullFilter(operation))
              .map(operation => {
                const title = `${columnName} ${operation.expression}`;

                return {
                  id: operation.id,
                  isPresent(context) {
                    return context.contextType === DataGridContextMenuService.cellContext;
                  },
                  isDisabled(context) {
                    return context.data.model.isLoading();
                  },
                  title: title + ' ..',
                  icon: '/icons/filter_custom.png',
                  onClick: async () => {
                    const isNull = this.isNull(model, resultIndex, cellValue);
                    const stringifyCellValue = this.toString(model, resultIndex, cellValue);
                    const customValue = await this.getCustomValue(title + ':', isNull ? '' : stringifyCellValue);
                    if (!customValue) {
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
          const supportedOperations = this.getColumnSupportedOperations(
            context.data.model,
            context.data.resultIndex,
            context.data.column
          );

          return !supportedOperations.some(operation => operation.id === IS_NULL_ID);
        },
        order: 3,
        titleGetter: context => {
          const columnName = this.getColumnName(context.data.model, context.data.resultIndex, context.data.column) || '';
          return `${columnName} IS NULL`;
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
          const supportedOperations = this.getColumnSupportedOperations(
            context.data.model,
            context.data.resultIndex,
            context.data.column
          );

          return !supportedOperations.some(operation => operation.id === IS_NOT_NULL_ID);
        },
        order: 4,
        separator: true,
        titleGetter: context => {
          const columnName = this.getColumnName(context.data.model, context.data.resultIndex, context.data.column) || '';
          return `${columnName} IS NOT NULL`;
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
          const filter = this.getFilter(context.data.model, context.data.resultIndex, context.data.column);
          return filter === null;
        },
        order: 5,
        icon: '/icons/filter_reset.png',
        titleGetter: context => {
          const columnName = this.getColumnName(context.data.model, context.data.resultIndex, context.data.column) || '';
          return `Delete filter for ${columnName}`;
        },
        onClick: async context => {
          await this.deleteFilter(context.data.model, context.data.resultIndex, context.data.column);
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
          const filterConstraints = this.getFilters(context.data.model, context.data.resultIndex);
          return filterConstraints.length === 0 && !context.data.model.requestInfo.requestFilter;
        },
        order: 6,
        title: 'data_grid_table_filter_reset_all_filters',
        onClick: async context => {
          await this.deleteFilters(context.data.model, context.data.resultIndex);
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuFilterToken(),
      {
        id: 'deleteFiltersAndSorting',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        order: 7,
        title: 'data_grid_table_delete_filters_and_sorting',
        icon: '/icons/erase.png',
        onClick: async context => {
          await this.deleteAllConstraints(context.data.model, context.data.resultIndex);
        },
      }
    );
  }
}
