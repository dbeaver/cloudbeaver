/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TSV, TSV_NEEDS_QUOTE_REGEX, TSV_QUOTE_ESCAPE_REGEX } from '../constants/tsv.js';

/**
 * Build text representation of selected cells for system clipboard (TSV format).
 */
export function buildTsvFromCells<T>(cells: Array<Array<T>>, getTextValue: (cell: T) => string): string {
  return cells
    .map(row =>
      row
        .map(cell => {
          const text = getTextValue(cell);
          if (TSV_NEEDS_QUOTE_REGEX.test(text)) {
            return TSV.QUOTE + text.replace(TSV_QUOTE_ESCAPE_REGEX, TSV.ESCAPED_QUOTE) + TSV.QUOTE;
          }
          return text;
        })
        .join(TSV.TAB),
    )
    .join(TSV.ROW_SEPARATOR);
}
