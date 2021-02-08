/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlResultSet } from '@cloudbeaver/core-sdk';

export const ResultSetTools = {
  getHeaders(resultSet: SqlResultSet): string[] {
    return resultSet.columns?.map(column => column.name!).filter(Boolean) || [];
  },
  getRows(resultSet: SqlResultSet, offset = 0, count?: number) {
    return resultSet.rows?.slice(offset, count) || [];
  },
  getLongestCells(resultSet: SqlResultSet, offset = 0, count?: number) {
    const rows = this.getRows(resultSet, offset, count);
    let cells: string[] = [];

    for (const row of rows) {
      if (cells.length === 0) {
        cells = row.map(v => String(v));
        continue;
      }

      for (let i = 0; i < row.length; i++) {
        const value = String(row[i]);

        if (value.length > cells[i].length) {
          cells[i] = value;
        }
      }
    }

    return cells;
  },
};
