/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test } from 'vitest';
import { getColumnHeaderDropTarget } from './useTableColumnDnD.js';

describe('getColumnHeaderDropTarget', () => {
  test('uses the entire column header as the drop target', () => {
    const columnHeader = document.createElement('div');
    const content = document.createElement('div');
    columnHeader.role = 'columnheader';
    columnHeader.append(content);

    expect(getColumnHeaderDropTarget(content)).toBe(columnHeader);
  });

  test('falls back to the drag handle outside a column header', () => {
    const content = document.createElement('div');

    expect(getColumnHeaderDropTarget(content)).toBe(content);
  });
});
