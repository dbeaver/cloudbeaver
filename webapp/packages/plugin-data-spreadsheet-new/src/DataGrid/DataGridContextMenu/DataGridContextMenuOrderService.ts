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

  private async changeOrder(
    model: IDatabaseDataModel<any>,
    resultIndex: number,
    columnIndex: number,
    order: Order
  ) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    const columnLabel = data.getColumn(columnIndex)?.label || '';

    constraints.setOrder(columnLabel, order, true);
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
        isHidden(context) {
          return context.data.model.isDisabled(context.data.resultIndex);
        },
        order: 1,
        title: 'data_grid_table_order',
        icon: 'order-arrow-unknown',
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
        isChecked: context => {
          const { model, resultIndex, column } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const columnLabel = data.getColumn(column)?.label || '';

          return constraints.getOrder(columnLabel) === EOrder.asc;
        },
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
        isChecked: context => {
          const { model, resultIndex, column } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const columnLabel = data.getColumn(column)?.label || '';

          return constraints.getOrder(columnLabel) === EOrder.desc;
        },
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
        isChecked: context => {
          const { model, resultIndex, column } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const columnLabel = data.getColumn(column)?.label || '';

          return constraints.getOrder(columnLabel) === null;
        },
        title: 'data_grid_table_disable_order',
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
          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          return constraints.orderConstraints.length < 2;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          constraints.deleteOrders();
          await context.data.model.refresh();
        },
        title: 'data_grid_table_disable_all_orders',
      }
    );
  }
}
