/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import {
  ActionService,
  DATA_CONTEXT_MENU,
  MenuService,
  KeyBindingService,
  ACTION_UNDO,
  ACTION_REDO,
  KEY_BINDING_REDO,
  KEY_BINDING_UNDO,
} from '@cloudbeaver/core-view';

import { DATA_VIEWER_CONSTRAINTS_DELETE_ACTION } from '../../DatabaseDataModel/Actions/ResultSet/Actions/DATA_VIEWER_CONSTRAINTS_DELETE_ACTION.js';
import { DATA_CONTEXT_DV_DDM } from '../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { isResultSetDataSource, ResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { DATA_VIEWER_DATA_MODEL_TOOLS_MENU } from './DATA_VIEWER_DATA_MODEL_TOOLS_MENU.js';
import { IDatabaseDataConstraintAction } from '../../DatabaseDataModel/Actions/IDatabaseDataConstraintAction.js';
import { GridHistoryAction } from '../../DatabaseDataModel/Actions/Grid/GridHistoryAction.js';

export const TableWhereFilter = importLazyComponent(() => import('./TableWhereFilter.js').then(module => module.TableWhereFilter));
export const TableHeaderMenu = importLazyComponent(() => import('./TableHeaderMenu.js').then(module => module.TableHeaderMenu));

export interface ITableHeaderPlaceholderProps {
  model: IDatabaseDataModel;
  resultIndex: number;
  simple: boolean;
}

@injectable(() => [MenuService, ActionService, KeyBindingService])
export class TableHeaderService extends Bootstrap {
  readonly tableHeaderPlaceholder = new PlaceholderContainer<ITableHeaderPlaceholderProps>();

  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
  ) {
    super();
  }

  override register(): void {
    this.tableHeaderPlaceholder.add(TableWhereFilter, 1, props => !isResultSetDataSource(props.model.source));
    this.tableHeaderPlaceholder.add(TableHeaderMenu, 2);

    this.actionService.addHandler({
      id: 'table-header-menu-base-handler',
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isHidden(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const isReadonly = model.isReadonly(context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!);

        if ([ACTION_UNDO, ACTION_REDO].includes(action)) {
          return isReadonly;
        }

        return false;
      },
      isActionApplicable(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const menu = context.hasValue(DATA_CONTEXT_MENU, DATA_VIEWER_DATA_MODEL_TOOLS_MENU);

        // For undo/redo actions, we don't need the menu or ResultSetDataSource check cause it also appears in data-editor
        if (action === ACTION_UNDO || action === ACTION_REDO) {
          return true;
        }

        if (!menu || !isResultSetDataSource(model.source)) {
          return false;
        }

        return true;
      },
      handler: async (context, action) => {
        switch (action) {
          case DATA_VIEWER_CONSTRAINTS_DELETE_ACTION: {
            const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
            const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
            const constraints = model.source.tryGetAction(resultIndex, IDatabaseDataConstraintAction);

            if (constraints) {
              constraints.deleteData();
              await model.request();
            }
            break;
          }
          case ACTION_UNDO: {
            const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
            const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
            const history = model.source.tryGetAction(resultIndex, GridHistoryAction);
            history?.undo();
            break;
          }
          case ACTION_REDO: {
            const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
            const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
            const history = model.source.tryGetAction(resultIndex, GridHistoryAction);
            history?.redo();
            break;
          }
        }
      },
      isDisabled: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (model.isLoading() || model.isDisabled(resultIndex)) {
          return true;
        }

        if (action === DATA_VIEWER_CONSTRAINTS_DELETE_ACTION) {
          const constraints = model.source.tryGetAction(resultIndex, IDatabaseDataConstraintAction);

          if (model.source.options?.whereFilter) {
            return false;
          }

          if (constraints) {
            return constraints.filterConstraints.length === 0 && constraints.orderConstraints.length === 0;
          }
        }

        if (action === ACTION_UNDO) {
          const history = model.source.tryGetAction(resultIndex, GridHistoryAction);
          return !history?.canUndo();
        }

        if (action === ACTION_REDO) {
          const history = model.source.tryGetAction(resultIndex, GridHistoryAction);
          return !history?.canRedo();
        }

        return true;
      },
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'table-header-undo',
      binding: KEY_BINDING_UNDO,
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isBindingApplicable(context, action) {
        return action === ACTION_UNDO;
      },
      handler: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const history = model.source.tryGetAction(resultIndex, GridHistoryAction);
        history?.undo();
      },
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'table-header-redo',
      binding: KEY_BINDING_REDO,
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isBindingApplicable(context, action) {
        return action === ACTION_REDO;
      },
      handler: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const history = model.source.tryGetAction(resultIndex, GridHistoryAction);
        history?.redo();
      },
    });

    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_TOOLS_MENU],
      getItems: (context, items) => [...items, DATA_VIEWER_CONSTRAINTS_DELETE_ACTION, ACTION_UNDO, ACTION_REDO],
    });
  }
}
