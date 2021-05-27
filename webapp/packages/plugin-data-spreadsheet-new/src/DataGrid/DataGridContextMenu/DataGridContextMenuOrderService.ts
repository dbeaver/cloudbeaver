/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { EOrder, IDatabaseDataModel, ResultSetConstraintAction, ResultSetDataAction, Order } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

@injectable()
export class DataGridContextMenuOrderService {
  private static menuOrderToken = 'menuOrder';

  constructor(
    private dataGridContextMenuService: DataGridContextMenuService,
  ) { }

  getMenuOrderToken(): string {
    return DataGridContextMenuOrderService.menuOrderToken;
  }

  private getColumnName(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    return data.getColumn(columnIndex)?.name;
  }

  private async changeOrder(
    model: IDatabaseDataModel<any>,
    resultIndex: number,
    columnIndex: number,
    order: Order
  ) {
    const columnName = this.getColumnName(model, resultIndex, columnIndex)!;
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

    constraints.setOrder(columnName, order, true);
    await model.refresh();
  }

  private getOrder(model: IDatabaseDataModel<any>, resultIndex: number, columnIndex: number) {
    const columnName = this.getColumnName(model, resultIndex, columnIndex)!;
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

    return constraints.getOrder(columnName);
  }

  private getSortingConstraints(model: IDatabaseDataModel<any>, resultIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    return constraints.getOrderConstraints();
  }

  private async removeSortingFromConstraints(model: IDatabaseDataModel<any>, resultIndex: number) {
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

    constraints.deleteOrders();
    await model.refresh();
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: this.getMenuOrderToken(),
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
      this.getMenuOrderToken(),
      {
        id: 'asc',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeOrder(context.data.model, context.data.resultIndex, context.data.column, EOrder.asc);
        },
        type: 'radio',
        isChecked: context => this.getOrder(
          context.data.model,
          context.data.resultIndex,
          context.data.column) === EOrder.asc,
        title: 'ASC',
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'desc',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeOrder(context.data.model, context.data.resultIndex, context.data.column, EOrder.desc);
        },
        type: 'radio',
        isChecked: context => this.getOrder(
          context.data.model,
          context.data.resultIndex,
          context.data.column) === EOrder.desc,
        title: 'DESC',
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'disableOrder',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeOrder(context.data.model, context.data.resultIndex, context.data.column, null);
        },
        type: 'radio',
        isChecked: context => this.getOrder(
          context.data.model,
          context.data.resultIndex,
          context.data.column) === null,
        title: 'data_grid_table_disable_sorting',
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'disableOrders',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const sortingConstraints = this.getSortingConstraints(context.data.model, context.data.resultIndex);
          return sortingConstraints.length === 0;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.removeSortingFromConstraints(context.data.model, context.data.resultIndex);
        },
        title: 'data_grid_table_disable_all_sorting',
      }
    );
  }
}
