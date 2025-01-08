/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ActionService, MenuRadioItem, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_RESULT_KEY,
  DatabaseDataConstraintAction,
  EOrder,
  type IDatabaseDataModel,
  type IDatabaseDataOptions,
  type IResultSetColumnKey,
  isResultSetDataModel,
  isResultSetDataSource,
  type Order,
  ResultSetDataAction,
  ResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_GRID_ORDERING_DISABLE_ALL } from '../Actions/Ordering/ACTION_DATA_GRID_ORDERING_DISABLE_ALL.js';
import { MENU_DATA_GRID_ORDERING } from './MENU_DATA_GRID_ORDERING.js';

@injectable()
export class DataGridContextMenuOrderService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  private async changeOrder(unknownModel: IDatabaseDataModel, resultIndex: number, column: IResultSetColumnKey, order: Order) {
    const model = unknownModel as any;
    if (!isResultSetDataModel<IDatabaseDataOptions>(model)) {
      throw new Error('Unsupported data model');
    }
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const constraints = model.source.getAction(resultIndex, DatabaseDataConstraintAction);
    const resultColumn = data.getColumn(column);

    if (!resultColumn) {
      throw new Error(`Failed to get result column info for the following column index: "${column.index}"`);
    }

    await model.request(() => {
      constraints.setOrder(resultColumn.position, order, true);
    });
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
      getItems: (context, items) => [...items, MENU_DATA_GRID_ORDERING],
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_ORDERING],
      getItems: (context, items) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const data = source.getAction(resultIndex, ResultSetDataAction);
        const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
        const resultColumn = data.getColumn(key.column);

        const result = [...items];

        if (resultColumn) {
          for (const order of [EOrder.asc, EOrder.desc, null]) {
            result.push(
              new MenuRadioItem(
                {
                  id: `data-grid-ordering-${order ? order : 'disable'}`,
                  label: order ? order.toUpperCase() : 'data_grid_table_disable_order',
                },
                {
                  onSelect: async () => {
                    await this.changeOrder(model, resultIndex, key.column, order);
                  },
                },
                { isChecked: () => constraints.getOrder(resultColumn.position) === order, isDisabled: () => model.isLoading() },
              ),
            );
          }
        }

        return [...result, ACTION_DATA_GRID_ORDERING_DISABLE_ALL];
      },
    });

    this.actionService.addHandler({
      id: 'data-grid-ordering-handler',
      actions: [ACTION_DATA_GRID_ORDERING_DISABLE_ALL],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isHidden(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (action === ACTION_DATA_GRID_ORDERING_DISABLE_ALL) {
          const source = model.source as unknown as ResultSetDataSource;
          const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);
          return !constraints.orderConstraints.length;
        }

        return false;
      },
      isDisabled: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        return model.isLoading();
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const source = model.source as unknown as ResultSetDataSource;

        switch (action) {
          case ACTION_DATA_GRID_ORDERING_DISABLE_ALL: {
            const constraints = source.getAction(resultIndex, DatabaseDataConstraintAction);

            await model.request(() => {
              constraints.deleteOrders();
            });
            break;
          }
        }
      },
    });
  }
}
