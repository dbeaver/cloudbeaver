/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ACTION_EDIT, ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION_ACTIONS,
  DATA_CONTEXT_DV_RESULT_KEY,
  DatabaseEditChangeType,
  isBooleanValuePresentationAvailable,
  isResultSetDataSource,
  ResultSetDataContentAction,
  ResultSetDataSource,
  ResultSetEditAction,
  ResultSetFormatAction,
  ResultSetSelectAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_GRID_EDITING_ADD_ROW } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_ADD_ROW.js';
import { ACTION_DATA_GRID_EDITING_DELETE_ROW } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_DELETE_ROW.js';
import { ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW.js';
import { ACTION_DATA_GRID_EDITING_DUPLICATE_ROW } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_DUPLICATE_ROW.js';
import { ACTION_DATA_GRID_EDITING_REVERT_ROW } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_REVERT_ROW.js';
import { ACTION_DATA_GRID_EDITING_REVERT_SELECTED_ROW } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_REVERT_SELECTED_ROW.js';
import { ACTION_DATA_GRID_EDITING_SET_TO_NULL } from '../Actions/Editing/ACTION_DATA_GRID_EDITING_SET_TO_NULL.js';
import { MENU_DATA_GRID_EDITING } from './MENU_DATA_GRID_EDITING.js';

@injectable()
export class DataGridContextMenuCellEditingService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  register(): void {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        return isResultSetDataSource(model.source) && !model.isDisabled(resultIndex) && !model.isReadonly(resultIndex);
      },
      getItems: (context, items) => [...items, MENU_DATA_GRID_EDITING],
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_EDITING],
      getItems: (context, items) => [
        ...items,
        ACTION_EDIT,
        ACTION_DATA_GRID_EDITING_SET_TO_NULL,
        ACTION_DATA_GRID_EDITING_ADD_ROW,
        ACTION_DATA_GRID_EDITING_DUPLICATE_ROW,
        ACTION_DATA_GRID_EDITING_DELETE_ROW,
        ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW,
        ACTION_DATA_GRID_EDITING_REVERT_ROW,
        ACTION_DATA_GRID_EDITING_REVERT_SELECTED_ROW,
      ],
    });

    this.actionService.addHandler({
      id: 'data-grid-editing-base-handler',
      menus: [MENU_DATA_GRID_EDITING],
      isActionApplicable(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const format = source.getAction(resultIndex, ResultSetFormatAction);
        const view = source.getAction(resultIndex, ResultSetViewAction);
        const content = source.getAction(resultIndex, ResultSetDataContentAction);
        const editor = source.getAction(resultIndex, ResultSetEditAction);
        const select = source.getActionImplementation(resultIndex, ResultSetSelectAction);

        const cellValue = view.getCellValue(key);
        const column = view.getColumn(key.column);
        const isComplex = format.isBinary(key) || format.isGeometry(key);
        const isTruncated = content.isTextTruncated(key);
        const selectedElements = select?.getSelectedElements() || [];
        // If we somehow added a new row, we can always edit it
        const canEdit = editor.getElementState(key) === DatabaseEditChangeType.add;

        if (model.isReadonly(resultIndex)) {
          return false;
        }

        if (action === ACTION_EDIT) {
          if (!column || cellValue === undefined || (format.isReadOnly(key) && !canEdit) || isComplex || isTruncated) {
            return false;
          }

          return !isBooleanValuePresentationAvailable(cellValue, column);
        }

        if (action === ACTION_DATA_GRID_EDITING_SET_TO_NULL) {
          return cellValue !== undefined && !(format.isReadOnly(key) && !canEdit) && !view.getColumn(key.column)?.required && !format.isNull(key);
        }

        if (action === ACTION_DATA_GRID_EDITING_ADD_ROW || action === ACTION_DATA_GRID_EDITING_DUPLICATE_ROW) {
          return editor.hasFeature('add');
        }

        if (action === ACTION_DATA_GRID_EDITING_DELETE_ROW) {
          return !(format.isReadOnly(key) && !canEdit) && editor.getElementState(key) !== DatabaseEditChangeType.delete;
        }

        if (action === ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW) {
          if ((format.isReadOnly(key) && !canEdit) || !editor.hasFeature('delete')) {
            return false;
          }

          return selectedElements.some(key => editor.getElementState(key) !== DatabaseEditChangeType.delete);
        }

        if (action === ACTION_DATA_GRID_EDITING_REVERT_ROW) {
          return editor.getElementState(key) !== null;
        }

        if (action === ACTION_DATA_GRID_EDITING_REVERT_SELECTED_ROW) {
          return selectedElements.some(key => editor.getElementState(key) !== null);
        }

        return [
          ACTION_EDIT,
          ACTION_DATA_GRID_EDITING_SET_TO_NULL,
          ACTION_DATA_GRID_EDITING_ADD_ROW,
          ACTION_DATA_GRID_EDITING_DUPLICATE_ROW,
          ACTION_DATA_GRID_EDITING_DELETE_ROW,
          ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW,
          ACTION_DATA_GRID_EDITING_REVERT_ROW,
          ACTION_DATA_GRID_EDITING_REVERT_SELECTED_ROW,
        ].includes(action);
      },
      getActionInfo(context, action) {
        if (action === ACTION_EDIT) {
          return { ...action.info, label: 'data_grid_table_editing_open_inline_editor', icon: 'edit' };
        }

        return action.info;
      },
      handler(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const actions = context.get(DATA_CONTEXT_DV_PRESENTATION_ACTIONS)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(resultIndex, ResultSetEditAction);
        const select = source.getActionImplementation(resultIndex, ResultSetSelectAction);

        const selectedElements = select?.getSelectedElements() || [];

        switch (action) {
          case ACTION_EDIT:
            actions.edit(key);
            break;
          case ACTION_DATA_GRID_EDITING_SET_TO_NULL:
            editor.set(key, null);
            break;
          case ACTION_DATA_GRID_EDITING_ADD_ROW:
            editor.addRow(key.row);
            break;
          case ACTION_DATA_GRID_EDITING_DUPLICATE_ROW:
            editor.duplicateRow(key);
            break;
          case ACTION_DATA_GRID_EDITING_DELETE_ROW:
            editor.deleteRow(key.row);
            break;
          case ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW:
            editor.delete(...selectedElements);
            break;
          case ACTION_DATA_GRID_EDITING_REVERT_ROW:
            editor.revert(key);
            break;
          case ACTION_DATA_GRID_EDITING_REVERT_SELECTED_ROW:
            editor.revert(...selectedElements);
            break;
        }
      },
    });
  }
}
