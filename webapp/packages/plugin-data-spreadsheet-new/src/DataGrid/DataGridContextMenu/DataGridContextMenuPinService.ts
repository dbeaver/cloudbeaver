/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION_ACTIONS,
  DATA_CONTEXT_DV_RESULT_KEY,
  GridViewAction,
  IDatabaseDataViewAction,
  isResultSetDataSource,
  MENU_DV_CONTEXT_MENU,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_GRID_PIN_COLUMN } from '../Actions/Pin/ACTION_DATA_GRID_PIN_COLUMN.js';
import { ACTION_DATA_GRID_PIN_ROW_BOTTOM } from '../Actions/Pin/ACTION_DATA_GRID_PIN_ROW_BOTTOM.js';
import { ACTION_DATA_GRID_PIN_ROW_TOP } from '../Actions/Pin/ACTION_DATA_GRID_PIN_ROW_TOP.js';
import { ACTION_DATA_GRID_UNPIN_ALL_COLUMNS } from '../Actions/Pin/ACTION_DATA_GRID_UNPIN_ALL_COLUMNS.js';
import { ACTION_DATA_GRID_UNPIN_ALL_ROWS } from '../Actions/Pin/ACTION_DATA_GRID_UNPIN_ALL_ROWS.js';
import { ACTION_DATA_GRID_UNPIN_COLUMN } from '../Actions/Pin/ACTION_DATA_GRID_UNPIN_COLUMN.js';
import { ACTION_DATA_GRID_UNPIN_ROW } from '../Actions/Pin/ACTION_DATA_GRID_UNPIN_ROW.js';

@injectable(() => [ActionService, MenuService])
export class DataGridContextMenuPinService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  register(): void {
    this.menuService.addCreator({
      root: true,
      menus: [MENU_DV_CONTEXT_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      getItems: (context, items) => [
        ...items,
        ACTION_DATA_GRID_PIN_COLUMN,
        ACTION_DATA_GRID_UNPIN_COLUMN,
        ACTION_DATA_GRID_UNPIN_ALL_COLUMNS,
        ACTION_DATA_GRID_PIN_ROW_TOP,
        ACTION_DATA_GRID_PIN_ROW_BOTTOM,
        ACTION_DATA_GRID_UNPIN_ROW,
        ACTION_DATA_GRID_UNPIN_ALL_ROWS,
      ],
    });

    this.actionService.addHandler({
      id: 'data-grid-pin-handler',
      actions: [
        ACTION_DATA_GRID_PIN_COLUMN,
        ACTION_DATA_GRID_UNPIN_COLUMN,
        ACTION_DATA_GRID_UNPIN_ALL_COLUMNS,
        ACTION_DATA_GRID_PIN_ROW_TOP,
        ACTION_DATA_GRID_PIN_ROW_BOTTOM,
        ACTION_DATA_GRID_UNPIN_ROW,
        ACTION_DATA_GRID_UNPIN_ALL_ROWS,
      ],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isHidden(context, action) {
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY);
        const presentationActions = context.has(DATA_CONTEXT_DV_PRESENTATION_ACTIONS) ? context.get(DATA_CONTEXT_DV_PRESENTATION_ACTIONS) : null;
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (!key) {
          return false;
        }

        if (action === ACTION_DATA_GRID_PIN_COLUMN) {
          return presentationActions?.isColumnPinned(key) === true;
        }

        if (action === ACTION_DATA_GRID_UNPIN_COLUMN) {
          return presentationActions?.isColumnPinned(key) === false;
        }

        if (action === ACTION_DATA_GRID_UNPIN_ALL_COLUMNS) {
          return !presentationActions?.hasPinnedColumns();
        }

        if (action === ACTION_DATA_GRID_PIN_ROW_TOP || action === ACTION_DATA_GRID_PIN_ROW_BOTTOM || action === ACTION_DATA_GRID_UNPIN_ROW) {
          if (key.row === undefined) {
            return false;
          }
          const view = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);

          if (action === ACTION_DATA_GRID_PIN_ROW_TOP) {
            return view.isRowPinnedTop(key.row);
          }
          if (action === ACTION_DATA_GRID_PIN_ROW_BOTTOM) {
            return view.isRowPinnedBottom(key.row);
          }
          if (action === ACTION_DATA_GRID_UNPIN_ROW) {
            return !view.isRowPinned(key.row);
          }
        }

        if (action === ACTION_DATA_GRID_UNPIN_ALL_ROWS) {
          const view = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);
          return !view.hasPinnedRows();
        }

        return false;
      },
      isActionApplicable(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        if (!isResultSetDataSource(model.source) || model.isDisabled(resultIndex)) {
          return false;
        }

        const view = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);

        if (action === ACTION_DATA_GRID_PIN_COLUMN) {
          return key.column !== undefined && !view.isColumnPinned(key.column);
        }

        if (action === ACTION_DATA_GRID_UNPIN_COLUMN) {
          return key.column !== undefined && view.isColumnPinned(key.column);
        }

        if (action === ACTION_DATA_GRID_UNPIN_ALL_COLUMNS) {
          return view.hasPinnedColumns();
        }

        if (action === ACTION_DATA_GRID_PIN_ROW_TOP || action === ACTION_DATA_GRID_PIN_ROW_BOTTOM || action === ACTION_DATA_GRID_UNPIN_ROW) {
          if (key.row === undefined) {
            return false;
          }
          const isPinned = view.isRowPinned(key.row);
          const isPinnedTop = view.isRowPinnedTop(key.row);
          const isPinnedBottom = view.isRowPinnedBottom(key.row);

          if (action === ACTION_DATA_GRID_PIN_ROW_TOP) {
            return !isPinnedTop;
          }
          if (action === ACTION_DATA_GRID_PIN_ROW_BOTTOM) {
            return !isPinnedBottom;
          }
          if (action === ACTION_DATA_GRID_UNPIN_ROW) {
            return isPinned;
          }
        }

        if (action === ACTION_DATA_GRID_UNPIN_ALL_ROWS) {
          return view.hasPinnedRows();
        }

        return false;
      },
      handler(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const view = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);

        switch (action) {
          case ACTION_DATA_GRID_PIN_COLUMN:
            if (key.column) {
              view.pinColumn(key.column);
            }
            break;
          case ACTION_DATA_GRID_UNPIN_COLUMN:
            if (key.column) {
              view.unpinColumn(key.column);
            }
            break;
          case ACTION_DATA_GRID_UNPIN_ALL_COLUMNS:
            view.unpinAllColumns();
            break;
          case ACTION_DATA_GRID_PIN_ROW_TOP:
            if (key.row) {
              view.pinRowTop(key.row);
            }
            break;
          case ACTION_DATA_GRID_PIN_ROW_BOTTOM:
            if (key.row) {
              view.pinRowBottom(key.row);
            }
            break;
          case ACTION_DATA_GRID_UNPIN_ROW:
            if (key.row) {
              view.unpinRow(key.row);
            }
            break;
          case ACTION_DATA_GRID_UNPIN_ALL_ROWS:
            view.unpinAllRows();
            break;
        }
      },
    });
  }
}
