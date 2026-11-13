/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ActionService, MenuRadioItem, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_RESULT_KEY,
  EOrder,
  GridDataResultAction,
  IDatabaseDataConstraintAction,
  type IDatabaseDataModel,
  type IDatabaseDataOptions,
  IDatabaseDataResultAction,
  type IGridColumnKey,
  isResultSetDataModel,
  isResultSetDataSource,
  type Order,
} from '@cloudbeaver/plugin-data-viewer';

import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { ACTION_DATA_GRID_ORDERING_DISABLE_ALL } from '../Actions/Ordering/ACTION_DATA_GRID_ORDERING_DISABLE_ALL.js';
import { MENU_DATA_GRID_ORDERING } from './MENU_DATA_GRID_ORDERING.js';

export class DataGridContextMenuOrderServiceImpl {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  private async changeOrder(unknownModel: IDatabaseDataModel, resultIndex: number, column: IGridColumnKey, order: Order) {
    const model = unknownModel as any;

    if (!isResultSetDataModel<IDatabaseDataOptions>(model)) {
      throw new Error('Unsupported data model');
    }

    const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);
    const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
    // TODO: fix column abstraction
    const resultColumn = data.getColumn(column) as SqlResultColumn | undefined;

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

        if (!isResultSetDataSource(model.source)) {
          return false;
        }

        const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);

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

        const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);
        const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
        // TODO: fix column abstraction
        const resultColumn = data.getColumn(key.column) as SqlResultColumn | undefined;

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
          const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);
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

        switch (action) {
          case ACTION_DATA_GRID_ORDERING_DISABLE_ALL: {
            const constraints = model.source.getAction(resultIndex, IDatabaseDataConstraintAction);

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

export type DataGridContextMenuOrderService = DataGridContextMenuOrderServiceImpl;

export class DataGridContextMenuOrderServiceDI extends Context.Service<DataGridContextMenuOrderServiceDI, DataGridContextMenuOrderServiceImpl>()(
  '@cloudbeaver/plugin-data-spreadsheet-new/DataGrid/DataGridContextMenu/DataGridContextMenuOrderService#DataGridContextMenuOrderService',
) {
  static readonly implementation = DataGridContextMenuOrderServiceImpl;

  static readonly dependencies = () => [ActionService, MenuService] as const;
  static readonly make: Effect.Effect<
    DataGridContextMenuOrderServiceImpl,
    never,
    Context.Service.Identifier<typeof ActionService> | Context.Service.Identifier<typeof MenuService>
  > = Effect.gen(function* makeDataGridContextMenuOrderService() {
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;

    return new DataGridContextMenuOrderServiceImpl(actionService, menuService);
  });
  static readonly layer: Layer.Layer<
    DataGridContextMenuOrderServiceDI,
    never,
    Context.Service.Identifier<typeof ActionService> | Context.Service.Identifier<typeof MenuService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataGridContextMenuOrderService = DataGridContextMenuOrderServiceDI;
