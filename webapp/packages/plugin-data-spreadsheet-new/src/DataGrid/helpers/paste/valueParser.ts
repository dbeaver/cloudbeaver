/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isStringifiedBoolean, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';
import { isNullSentinel } from '../constants/nullSentinel.js';

/**
 * Parse and validate a string value for a specific cell.
 * Returns undefined if the value is not valid for the cell type.
 * Returns null if the value represents a null sentinel.
 */
export function parseValueForCell(value: string, key: IGridDataKey, tableData: ITableData): string | null | undefined {
  // Handle null sentinels (both current and legacy format for backwards compatibility)
  if (isNullSentinel(value)) {
    return null;
  }

  // Validate boolean columns
  const columnInfo = tableData.getColumnInfo(key.column);
  if (columnInfo?.dataKind?.toLowerCase() === 'boolean') {
    // Only allow valid boolean strings for boolean columns
    if (!isStringifiedBoolean(value)) {
      return undefined;
    }
  }

  return value;
}
