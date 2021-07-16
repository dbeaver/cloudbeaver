/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ResultSetDataAction, ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { isBooleanFormatterAvailable } from '../Formatters/CellFormatters/isBooleanFormatterAvailable';
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
          return format.isReadOnly({ column: context.data.column, row: context.data.row })
            || context.data.model.isDisabled(context.data.resultIndex);
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
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const editor = context.data.model.source.getEditor(context.data.resultIndex);
          const cellValue = editor.getCell(context.data.row, context.data.column);
          const column = data.getColumn(context.data.column);

          if (!column) {
            return true;
          }

          return isBooleanFormatterAvailable(cellValue, column);
        },
        order: 0,
        title: 'data_grid_table_editing_open_inline_editor',
        icon: 'edit',
        onClick(context) {
          context.data.spreadsheetActions.edit({ column: context.data.column, row: context.data.row });
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
          const { column, row, model, resultIndex } = context.data;
          const data = model.source.getAction(resultIndex, ResultSetDataAction);
          const format = model.source.getAction(resultIndex, ResultSetFormatAction);
          const cellValue = data.getCellValue({ column, row });

          return data.getColumn(column)?.required || format.isNull(cellValue);
        },
        order: 1,
        title: 'data_grid_table_editing_set_to_null',
        onClick(context) {
          context.data.model.source.getEditor(context.data.resultIndex)
            .setCell(context.data.row, context.data.column, null);
        },
      }
    );
  }
}
