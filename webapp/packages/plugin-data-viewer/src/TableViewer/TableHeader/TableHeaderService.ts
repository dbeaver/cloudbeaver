/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { MenuService, ActionService, DATA_CONTEXT_MENU, MenuSeparatorItem } from '@cloudbeaver/core-view';

import { DELETE_CONSTRAINTS_ACTION } from '../../DatabaseDataModel/Actions/ResultSet/Actions/DELETE_CONSTRAINTS_ACTION';
import { REFRESH_RESULT_SET_ACTION } from '../../DatabaseDataModel/Actions/ResultSet/Actions/REFRESH_RESULT_SET_ACTION';
import { ResultSetConstraintAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { DATA_CONTEXT_TABLE_HEADER_MODEL } from './DATA_CONTEXT_TABLE_HEADER_MODEL';
import { DATA_CONTEXT_TABLE_HEADER_RESULT_INDEX } from './DATA_CONTEXT_TABLE_HEADER_RESULT_INDEX';
import { TABLE_HEADER_MENU } from './TABLE_HEADER_MENU';
import { TableHeaderMenu } from './TableHeaderMenu';
import { TableWhereFilter } from './TableWhereFilter';

export interface ITableHeaderPlaceholderProps {
  model: IDatabaseDataModel<any, any>;
  resultIndex: number;
}

@injectable()
export class TableHeaderService extends Bootstrap {
  readonly tableHeaderPlaceholder = new PlaceholderContainer<ITableHeaderPlaceholderProps>();

  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService
  ) {
    super();
  }

  register(): void {
    this.tableHeaderPlaceholder.add(TableWhereFilter, 1);
    this.tableHeaderPlaceholder.add(TableHeaderMenu, 2);

    this.actionService.addHandler({
      id: 'table-header-menu-base-handler',
      isActionApplicable(context, action) {
        const menu = context.find(DATA_CONTEXT_MENU, TABLE_HEADER_MENU);
        const model = context.tryGet(DATA_CONTEXT_TABLE_HEADER_MODEL);
        const resultIndex = context.tryGet(DATA_CONTEXT_TABLE_HEADER_RESULT_INDEX);

        if (!menu || !model || resultIndex === undefined) {
          return false;
        }

        return true;
      },
      handler: async (context, action) => {
        switch (action) {
          case DELETE_CONSTRAINTS_ACTION: {
            const model = context.get(DATA_CONTEXT_TABLE_HEADER_MODEL);
            const resultIndex = context.get(DATA_CONTEXT_TABLE_HEADER_RESULT_INDEX);
            const constraints = model.source.tryGetAction(resultIndex, ResultSetConstraintAction);

            if (constraints) {
              constraints.deleteData();
              await model.request();
            }
            break;
          }
          case REFRESH_RESULT_SET_ACTION: {
            const model = context.get(DATA_CONTEXT_TABLE_HEADER_MODEL);
            await model.refresh();
            break;
          }
        }
      },
      getActionInfo: (context, action) => {
        if (context.get(DATA_CONTEXT_MENU) === TABLE_HEADER_MENU) {
          return { ...action.info, label: '' };
        }

        return action.info;
      },
      isDisabled: (context, action) => {
        const model = context.get(DATA_CONTEXT_TABLE_HEADER_MODEL);
        const resultIndex = context.get(DATA_CONTEXT_TABLE_HEADER_RESULT_INDEX);

        if (model.isLoading() || model.isDisabled(resultIndex)) {
          return true;
        }

        if (action === DELETE_CONSTRAINTS_ACTION) {
          const constraints = model.source.tryGetAction(resultIndex, ResultSetConstraintAction);

          if (constraints) {
            return constraints.filterConstraints.length === 0 && constraints.orderConstraints.length === 0;
          }
        }

        if (action === REFRESH_RESULT_SET_ACTION) {
          return false;
        }

        return true;
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === TABLE_HEADER_MENU,
      getItems: (context, items) => [
        ...items,
        DELETE_CONSTRAINTS_ACTION,
        new MenuSeparatorItem(),
        REFRESH_RESULT_SET_ACTION,

      ],
    });
  }

  load(): void | Promise<void> { }
}
