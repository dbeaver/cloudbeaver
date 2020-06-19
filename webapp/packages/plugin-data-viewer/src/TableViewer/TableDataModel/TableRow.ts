/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type CellValue = string | number | object

export type TableRow = CellValue[]

export type SomeTableRows = Map<number, TableRow>; // number - row number in the table

export type RowValues = {
  [columnNumber: number]: CellValue;
}
