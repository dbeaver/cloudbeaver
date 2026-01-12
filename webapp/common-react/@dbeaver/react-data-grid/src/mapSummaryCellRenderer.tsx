/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { RenderSummaryCellProps } from 'react-data-grid';
import type { IInnerRow } from './IInnerRow.js';
import { SummaryCellRenderer } from './renderers/SummaryCellRenderer.js';

export function mapSummaryCellRenderer(colIdx: number) {
  return function RenderSummaryCell({ row, column }: RenderSummaryCellProps<unknown, IInnerRow>) {
    const rowIdx = (row as IInnerRow).idx;
    return <SummaryCellRenderer rowIdx={rowIdx} column={column} />;
  };
}
