/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICellContext } from './types.js';

/**
 * Get raw cell value, preferring edited value if available.
 */
export function getCellRawValue(ctx: ICellContext): unknown {
  const { tableData, key } = ctx;
  const holder = tableData.getCellHolder(key);

  if (tableData.editor) {
    const editedValue = tableData.editor.get(key);
    if (editedValue !== undefined) {
      return editedValue;
    }
  }

  return holder.value;
}

/**
 * Check if a cell can accept pasted values.
 */
export function isCellPasteable(ctx: ICellContext): boolean {
  const { tableData, key } = ctx;
  const holder = tableData.getCellHolder(key);

  if (tableData.format.isBinary(holder) || tableData.format.isGeometry(holder)) {
    return false;
  }

  if (tableData.isCellReadonly(key)) {
    return false;
  }

  return true;
}
