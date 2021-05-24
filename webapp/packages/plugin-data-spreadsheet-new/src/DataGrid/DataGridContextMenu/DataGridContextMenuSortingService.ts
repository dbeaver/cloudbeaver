/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService } from '@cloudbeaver/core-dialogs';
import { ESortMode, getNextSortMode, IDatabaseDataModel, ResultSetDataAction, ResultSetSortAction, SortMode } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

@injectable()
export class DataGridContextMenuSortingService {
  private static menuSortingToken = 'menuSorting';

  constructor(
    private dataGridContextMenuService: DataGridContextMenuService,
    private contextMenuService: ContextMenuService,
  ) { }

  getMenuSortingToken(): string {
    return DataGridContextMenuSortingService.menuSortingToken;
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

  private getSortingConstraints(model: IDatabaseDataModel<any>, resultIndex: number) {
    const sorting = model.source.getAction(resultIndex, ResultSetSortAction);
    return sorting.getSortingConstraints();
  }

  private async removeSortingConstraints(model: IDatabaseDataModel<any>, resultIndex: number) {
    const sorting = model.source.getAction(resultIndex, ResultSetSortAction);

    sorting.removeSortingConstraints();
    await model.refresh();
  }

  register(): void {
    this.dataGridContextMenuService.add(
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
    this.dataGridContextMenuService.add(
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
        title: 'ASC',
      }
    );
    this.dataGridContextMenuService.add(
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
        title: 'DESC',
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuSortingToken(),
      {
        id: 'disableSorting',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeSortMode(context.data.model, context.data.resultIndex, context.data.column, null);
        },
        type: 'radio',
        isChecked: context => this.getSortMode(
          context.data.model,
          context.data.resultIndex,
          context.data.column) === null,
        title: 'data_grid_table_disable_sorting',
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuSortingToken(),
      {
        id: 'disableAllSorting',
        isPresent: context => {
          const sortingConstraints = this.getSortingConstraints(context.data.model, context.data.resultIndex);
          return context.contextType === DataGridContextMenuService.cellContext && sortingConstraints.length > 1;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.removeSortingConstraints(context.data.model, context.data.resultIndex);
        },
        title: 'data_grid_table_disable_all_sorting',
      }
    );
  }
}
