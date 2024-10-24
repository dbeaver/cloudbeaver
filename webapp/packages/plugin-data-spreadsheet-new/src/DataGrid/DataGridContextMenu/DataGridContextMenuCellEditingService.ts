/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
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

import { DataGridContextMenuService } from './DataGridContextMenuService.js';

@injectable()
export class DataGridContextMenuCellEditingService {
  private static readonly menuEditingToken = 'menuEditing';

  constructor(private readonly dataGridContextMenuService: DataGridContextMenuService) {}

  getMenuEditingToken(): string {
    return DataGridContextMenuCellEditingService.menuEditingToken;
  }

  register(): void {
    this.dataGridContextMenuService.add(this.dataGridContextMenuService.getMenuToken(), {
      id: this.getMenuEditingToken(),
      order: 4,
      title: 'data_grid_table_editing',
      icon: 'edit',
      isPanel: true,
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext;
      },
      isHidden(context) {
        return context.data.model.isDisabled(context.data.resultIndex) || context.data.model.isReadonly(context.data.resultIndex);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'open_inline_editor',
      order: 0,
      title: 'data_grid_table_editing_open_inline_editor',
      icon: 'edit',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const format = source.getAction(context.data.resultIndex, ResultSetFormatAction);
        const view = source.getAction(context.data.resultIndex, ResultSetViewAction);
        const content = source.getAction(context.data.resultIndex, ResultSetDataContentAction);
        const cellValue = view.getCellValue(context.data.key);
        const column = view.getColumn(context.data.key.column);
        const isComplex = format.isBinary(context.data.key) || format.isGeometry(context.data.key);
        const isTruncated = content.isTextTruncated(context.data.key);

        if (!column || cellValue === undefined || format.isReadOnly(context.data.key) || isComplex || isTruncated) {
          return true;
        }

        return isBooleanValuePresentationAvailable(cellValue, column);
      },
      onClick(context) {
        context.data.spreadsheetActions.edit(context.data.key);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'set_to_null',
      order: 1,
      title: 'data_grid_table_editing_set_to_null',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const { key, model, resultIndex } = context.data;
        const source = model.source as unknown as ResultSetDataSource;
        const view = source.getAction(resultIndex, ResultSetViewAction);
        const format = source.getAction(resultIndex, ResultSetFormatAction);
        const cellValue = view.getCellValue(key);

        return cellValue === undefined || format.isReadOnly(context.data.key) || view.getColumn(key.column)?.required || format.isNull(key);
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        source.getAction(context.data.resultIndex, ResultSetEditAction).set(context.data.key, null);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'row_add',
      order: 5,
      icon: '/icons/data_add_sm.svg',
      title: 'data_grid_table_editing_row_add',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        return !editor.hasFeature('add');
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        editor.addRow(context.data.key.row);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'row_add_copy',
      order: 5.5,
      icon: '/icons/data_add_copy_sm.svg',
      title: 'data_grid_table_editing_row_add_copy',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        return !editor.hasFeature('add');
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        editor.duplicateRow(context.data.key);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'row_delete',
      order: 6,
      icon: '/icons/data_delete_sm.svg',
      title: 'data_grid_table_editing_row_delete',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);

        if (context.data.model.isReadonly(context.data.resultIndex) || !editor.hasFeature('delete')) {
          return true;
        }

        const format = source.getAction(context.data.resultIndex, ResultSetFormatAction);
        return format.isReadOnly(context.data.key) || editor.getElementState(context.data.key) === DatabaseEditChangeType.delete;
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        editor.deleteRow(context.data.key.row);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'row_delete_selected',
      order: 6.1,
      icon: '/icons/data_delete_sm.svg',
      title: 'data_viewer_action_edit_delete',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);

        if (context.data.model.isReadonly(context.data.resultIndex) || !editor.hasFeature('delete')) {
          return true;
        }

        const select = source.getActionImplementation(context.data.resultIndex, ResultSetSelectAction);

        const selectedElements = select?.getSelectedElements() || [];

        return !selectedElements.some(key => editor.getElementState(key) !== DatabaseEditChangeType.delete);
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        const select = source.getActionImplementation(context.data.resultIndex, ResultSetSelectAction);

        const selectedElements = select?.getSelectedElements() || [];

        editor.delete(...selectedElements);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'row_revert',
      order: 7,
      icon: '/icons/data_revert_sm.svg',
      title: 'data_grid_table_editing_row_revert',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        return editor.getElementState(context.data.key) === null;
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        editor.revert(context.data.key);
      },
    });
    this.dataGridContextMenuService.add(this.getMenuEditingToken(), {
      id: 'row_revert_selected',
      order: 7.1,
      icon: '/icons/data_revert_sm.svg',
      title: 'data_viewer_action_edit_revert',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      isHidden(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        const select = source.getActionImplementation(context.data.resultIndex, ResultSetSelectAction);

        const selectedElements = select?.getSelectedElements() || [];
        return !selectedElements.some(key => editor.getElementState(key) !== null);
      },
      onClick(context) {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const editor = source.getAction(context.data.resultIndex, ResultSetEditAction);
        const select = source.getActionImplementation(context.data.resultIndex, ResultSetSelectAction);

        const selectedElements = select?.getSelectedElements() || [];
        editor.revert(...selectedElements);
      },
    });
  }
}
