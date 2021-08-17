/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { isBooleanValuePresentationAvailable, ResultSetDataAction, ResultSetEditAction, ResultSetFormatAction, ResultSetViewAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

@injectable()
export class DataGridContextMenuCellEditingService {
  private static menuEditingToken = 'menuEditing';

  constructor(
    private dataGridContextMenuService: DataGridContextMenuService
  ) { }

  getMenuEditingToken(): string {
    return DataGridContextMenuCellEditingService.menuEditingToken;
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: this.getMenuEditingToken(),
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          const format = context.data.model.source.getAction(context.data.resultIndex, ResultSetFormatAction);
          return format.isReadOnly(context.data.key)
            || context.data.model.isDisabled(context.data.resultIndex)
            || context.data.model.isReadonly();
        },
        order: 4,
        title: 'data_grid_table_editing',
        icon: 'edit',
        isPanel: true,
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuEditingToken(),
      {
        id: 'open_inline_editor',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          const view = context.data.model.source.getAction(context.data.resultIndex, ResultSetViewAction);
          const cellValue = view.getCellValue(context.data.key);
          const column = view.getColumn(context.data.key.column);

          if (!column || cellValue === undefined) {
            return true;
          }

          return isBooleanValuePresentationAvailable(cellValue, column);
        },
        order: 0,
        title: 'data_grid_table_editing_open_inline_editor',
        icon: 'edit',
        onClick(context) {
          context.data.spreadsheetActions.edit(context.data.key);
        },
      }
    );
    this.dataGridContextMenuService.add(
      this.getMenuEditingToken(),
      {
        id: 'set_to_null',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        isHidden(context) {
          const { key, model, resultIndex } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const format = model.source.getAction(resultIndex, ResultSetFormatAction);
          const cellValue = data.getCellValue(key);

          return cellValue === undefined || data.getColumn(key.column)?.required || format.isNull(cellValue);
        },
        order: 1,
        title: 'data_grid_table_editing_set_to_null',
        onClick(context) {
          context.data.model.source.getAction(context.data.resultIndex, ResultSetEditAction)
            .set(context.data.key, null);
        },
      }
    );
  }
}
