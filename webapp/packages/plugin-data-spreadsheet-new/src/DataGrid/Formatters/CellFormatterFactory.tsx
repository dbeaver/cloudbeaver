/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';

import { isBooleanValuePresentationAvailable, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../CellRenderer/CellContext.js';
import { TableDataContext, type ITableData } from '../TableDataContext.js';
import { BlobFormatter } from './CellFormatters/BlobFormatter.js';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter.js';
import { TextFormatter } from './CellFormatters/TextFormatter.js';
import type { ICellFormatterProps } from './ICellFormatterProps.js';
import { IndexFormatter } from './IndexFormatter.js';
import { DateTimeFormatter } from './CellFormatters/DateTimeFormatter.js';
import { NumberFormatter } from './CellFormatters/NumberFormatter.js';

type FormatterSelector = (tableDataContext: ITableData, cell: IGridDataKey) => React.FC<ICellFormatterProps> | null;

const formatterSelectors: FormatterSelector[] = [
  // Binary
  (tableDataContext, cell) => {
    const holder = tableDataContext.getCellHolder(cell);
    return tableDataContext.format.isBinary(holder) ? BlobFormatter : null;
  },

  // Boolean
  (tableDataContext, cell) => {
    const holder = tableDataContext.getCellHolder(cell);
    const resultColumn = tableDataContext.getColumnInfo(cell.column);
    return resultColumn && isBooleanValuePresentationAvailable(holder.value, resultColumn) ? BooleanFormatter : null;
  },

  // DateTime
  (tableDataContext, cell) => {
    if (!tableDataContext.useUserFormatting) {
      return null;
    }
    const resultColumn = tableDataContext.getColumnInfo(cell.column);
    return resultColumn?.dataKind?.toUpperCase() === 'DATETIME' ? DateTimeFormatter : null;
  },

  // Numeric
  (tableDataContext, cell) => {
    if (!tableDataContext.useUserFormatting) {
      return null;
    }
    const resultColumn = tableDataContext.getColumnInfo(cell.column);
    return resultColumn?.dataKind?.toUpperCase() === 'NUMERIC' ? NumberFormatter : null;
  },
];

export const CellFormatterFactory = observer<ICellFormatterProps>(function CellFormatterFactory(props) {
  const formatterRef = useRef<React.FC<ICellFormatterProps> | null>(null);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);

  if (formatterRef.current === null) {
    formatterRef.current = TextFormatter;

    if (cellContext.cell) {
      for (const selector of formatterSelectors) {
        const formatter = selector(tableDataContext, cellContext.cell);
        if (formatter) {
          formatterRef.current = formatter;
          break;
        }
      }
    } else {
      formatterRef.current = IndexFormatter;
    }
  }

  const Formatter = formatterRef.current!;

  return <Formatter {...props} />;
});
