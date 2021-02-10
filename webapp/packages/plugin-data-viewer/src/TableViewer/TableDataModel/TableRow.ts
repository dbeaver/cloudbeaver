/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type CellValue = string | number | Record<any, unknown>;

export type TableRow = CellValue[];

export type SomeTableRows = Map<number, TableRow>; // number - row number in the table

export interface RowValues {
  [columnNumber: number]: CellValue;
}
