/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TableSelection } from './TableSelection/TableSelection';

export type AgGridContext = {
  selection: TableSelection;
  isReadonly(): boolean;
  isCellEdited(rowId: number, column: string): boolean;
  editCellValue(rowNumber: number, column: string, value: any, editing: boolean): void;
  revertCellValue(rowNumber: number, column: string): void;
  onEditSave(): void;
  onEditCancel(): void;
}
