/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import { isResultSetContentValue } from '@cloudbeaver/plugin-data-viewer';

export const ResultSetTools = {
  getHeaders(resultSet: SqlResultSet): string[] {
    return resultSet.columns?.map(column => column.name!).filter(Boolean) || [];
  },
  getRows(resultSet: SqlResultSet, offset = 0, count?: number): any[][] {
    return resultSet.rows?.slice(offset, count) || [];
  },
  getLongestCells(resultSet: SqlResultSet, offset = 0, count?: number): string[] {
    const rows = this.getRows(resultSet, offset, count);
    let cells: string[] = [];

    function getStringValue(value: any): string {
      if (isResultSetContentValue(value) && value.text !== undefined) {
        return value.text;
      }
      return String(value);
    }

    for (const row of rows) {
      if (cells.length === 0) {
        cells = row.map(v => getStringValue(v));
        continue;
      }

      for (let i = 0; i < row.length; i++) {
        const value = getStringValue(row[i]);

        if (value.length > cells[i].length) {
          cells[i] = value;
        }
      }
    }

    return cells;
  },
};
