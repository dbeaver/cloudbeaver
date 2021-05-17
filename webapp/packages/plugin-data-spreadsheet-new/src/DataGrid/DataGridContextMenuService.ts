/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IMenuPanel } from '@cloudbeaver/core-dialogs';
import { IDatabaseDataModel, ResultSetDataAction, ESortMode, getNextSortMode, ResultSetSortAction, SortMode } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridCellMenuContext {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  row: number;
  column: number;
}

@injectable()
export class DataGridContextMenuService {
  static cellContext = 'data-grid-cell-context-menu';
  private static menuToken = 'dataGridCell';
  private static menuSortingToken = 'menuSorting';

  constructor(
    private contextMenuService: ContextMenuService,
  ) { }

  getMenuToken(): string {
    return DataGridContextMenuService.menuToken;
  }

  getMenuSortingToken(): string {
    return DataGridContextMenuService.menuSortingToken;
  }

  constructMenuWithContext(
    model: IDatabaseDataModel<any>,
    resultIndex: number,
    row: number,
    column: number
  ): IMenuPanel {
    return this.contextMenuService.createContextMenu<IDataGridCellMenuContext>({
      menuId: this.getMenuToken(),
      contextType: DataGridContextMenuService.cellContext,
      data: { model, resultIndex, row, column },
    });
  }

  private getColumnName(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    return data.getColumn(columnIndex)?.name;
  }

  private async changeSortMode(
    model: IDatabaseDataModel<any>,
    resultIndex: number,
    columnIndex: number,
    sortMode: SortMode
  ) {
    const columnName = this.getColumnName(model, resultIndex, columnIndex)!;
    const sorting = model.source.getAction(resultIndex, ResultSetSortAction);

    sorting.setSortMode(columnName, sortMode, true);
    await model.refresh();
  }

  private getSortMode(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const columnName = this.getColumnName(model, resultIndex, columnIndex)!;
    const sorting = model.source.getAction(resultIndex, ResultSetSortAction);

    return sorting.getSortMode(columnName);
  }

  register() {
    this.contextMenuService.addMenuItem<IDataGridCellMenuContext>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: this.getMenuSortingToken(),
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        order: 0,
        title: 'data_grid_table_sorting',
        icon: '/icons/sorting.png',
        isPanel: true,
      }
    );
    this.contextMenuService.addMenuItem<IDataGridCellMenuContext>(
      this.getMenuSortingToken(),
      {
        id: 'asc',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeSortMode(context.data.model, context.data.resultIndex, context.data.column, ESortMode.asc);
        },
        type: 'radio',
        isChecked: context => this.getSortMode(
          context.data.model,
          context.data.resultIndex,
          context.data.column) === ESortMode.asc,
        titleGetter: context => {
          const columnName = this.getColumnName(context.data.model, context.data.resultIndex, context.data.column)!;
          return `Order by ${columnName} ASC`;
        },
      }
    );
    this.contextMenuService.addMenuItem<IDataGridCellMenuContext>(
      this.getMenuSortingToken(),
      {
        id: 'desc',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeSortMode(context.data.model, context.data.resultIndex, context.data.column, ESortMode.desc);
        },
        type: 'radio',
        isChecked: context => this.getSortMode(
          context.data.model,
          context.data.resultIndex,
          context.data.column) === ESortMode.desc,
        titleGetter: context => {
          const columnName = this.getColumnName(context.data.model, context.data.resultIndex, context.data.column)!;
          return `Order by ${columnName} DESC`;
        },
      }
    );
    this.contextMenuService.addMenuItem<IDataGridCellMenuContext>(
      this.getMenuSortingToken(),
      {
        id: 'toggleSorting',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          const nextSortMode = getNextSortMode(
            this.getSortMode(context.data.model, context.data.resultIndex, context.data.column)
          );
          await this.changeSortMode(context.data.model, context.data.resultIndex, context.data.column, nextSortMode);
        },
        title: 'data_grid_table_sorting_toggle',
      }
    );
  }
}
