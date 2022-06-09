/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { EOrder, IDatabaseDataModel, ResultSetConstraintAction, ResultSetDataAction, Order, IResultSetColumnKey } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

@injectable()
export class DataGridContextMenuOrderService {
  private static readonly menuOrderToken = 'menuOrder';

  constructor(
    private readonly dataGridContextMenuService: DataGridContextMenuService,
  ) { }

  getMenuOrderToken(): string {
    return DataGridContextMenuOrderService.menuOrderToken;
  }

  private async changeOrder(
    model: IDatabaseDataModel,
    resultIndex: number,
    column: IResultSetColumnKey,
    order: Order
  ) {
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    const resultColumn = data.getColumn(column);

    if (!resultColumn) {
      throw new Error(`Failed to get result column info for the following column index: "${column.index}"`);
    }

    await model.requestDataAction(async () => {
      constraints.setOrder(resultColumn.position, order, true);
      await model.request(true);
    });
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: this.getMenuOrderToken(),
        order: 1,
        title: 'data_grid_table_order',
        icon: 'order-arrow-unknown',
        isPanel: true,
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          return !constraints.supported || context.data.model.isDisabled(context.data.resultIndex);
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'asc',
        type: 'radio',
        title: 'ASC',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeOrder(context.data.model, context.data.resultIndex, context.data.key.column, EOrder.asc);
        },
        isChecked: context => {
          const { model, resultIndex, key } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const resultColumn = data.getColumn(key.column);

          return !!resultColumn && constraints.getOrder(resultColumn.position) === EOrder.asc;
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'desc',
        type: 'radio',
        title: 'DESC',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeOrder(context.data.model, context.data.resultIndex, context.data.key.column, EOrder.desc);
        },
        isChecked: context => {
          const { model, resultIndex, key } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const resultColumn = data.getColumn(key.column);

          return !!resultColumn && constraints.getOrder(resultColumn.position) === EOrder.desc;
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'disableOrder',
        type: 'radio',
        title: 'data_grid_table_disable_order',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          await this.changeOrder(context.data.model, context.data.resultIndex, context.data.key.column, null);
        },
        isChecked: context => {
          const { model, resultIndex, key } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
          const resultColumn = data.getColumn(key.column);

          return !!resultColumn && constraints.getOrder(resultColumn.position) === null;
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuOrderToken(),
      {
        id: 'disableOrders',
        title: 'data_grid_table_disable_all_orders',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden: context => {
          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          return !constraints.orderConstraints.length;
        },
        isDisabled: context => context.data.model.isLoading(),
        onClick: async context => {
          const constraints = context.data.model.source.getAction(context.data.resultIndex, ResultSetConstraintAction);
          await context.data.model.requestDataAction(async () => {
            constraints.deleteOrders();
            await context.data.model.request(true);
          });
        },
      }
    );
  }
}
