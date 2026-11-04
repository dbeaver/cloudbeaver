/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isBooleanValuePresentationAvailable, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../TableDataContext.js';
import { BlobFormatter } from './CellFormatters/BlobFormatter.js';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter.js';
import { TextFormatter } from './CellFormatters/TextFormatter.js';
import type { ICellFormatterProps } from './ICellFormatterProps.js';
import { IndexFormatter } from './IndexFormatter.js';
import { DateTimeFormatter } from './CellFormatters/DateTimeFormatter.js';
import { NumberFormatter } from './CellFormatters/NumberFormatter.js';

interface IFormatterContext {
  tableDataContext: ITableData;
  hasFormatters: boolean;
  holder: ReturnType<ITableData['getCellHolder']>;
  resultColumn: ReturnType<ITableData['getColumnInfo']>;
}

type FormatterSelector = (context: IFormatterContext, cell: IGridDataKey) => React.FC<ICellFormatterProps> | null;

const formatterSelectors: FormatterSelector[] = [
  // Binary
  context => (context.tableDataContext.format.isBinary(context.holder) ? BlobFormatter : null),

  // Boolean
  context => (context.resultColumn && isBooleanValuePresentationAvailable(context.holder.value, context.resultColumn) ? BooleanFormatter : null),

  // DateTime
  context => {
    if (!context.hasFormatters) {
      return null;
    }

    return context.resultColumn?.dataKind?.toUpperCase() === 'DATETIME' ? DateTimeFormatter : null;
  },

  // Numeric
  context => {
    if (!context.hasFormatters) {
      return null;
    }

    return context.resultColumn?.dataKind?.toUpperCase() === 'NUMERIC' ? NumberFormatter : null;
  },
];

export function getCellFormatter(tableDataContext: ITableData, cell: IGridDataKey | undefined, hasFormatters: boolean): React.FC<ICellFormatterProps> {
  if (!cell) {
    return IndexFormatter;
  }

  const context: IFormatterContext = {
    tableDataContext,
    hasFormatters,
    holder: tableDataContext.getCellHolder(cell),
    resultColumn: tableDataContext.getColumnInfo(cell.column),
  };

  for (const selector of formatterSelectors) {
    const formatter = selector(context, cell);

    if (formatter) {
      return formatter;
    }
  }

  return TextFormatter;
}
