/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed } from '@cloudbeaver/core-blocks';
import { NullFormatter as GridNullFormatter } from '@cloudbeaver/plugin-data-grid';

import { CellContext } from '../../CellRenderer/CellContext.js';
import { DateTimeKind, useFormattingContext } from '../../FormattingContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import type { ICellFormatterProps } from '../ICellFormatterProps.js';

export const DateTimeFormatter = observer<ICellFormatterProps>(function DateTimeFormatter() {
  const tableDataContext = useContext(TableDataContext);
  const formattingContext = useFormattingContext();
  const cellContext = useContext(CellContext);

  if (!cellContext.cell) {
    return null;
  }

  const formatter = tableDataContext.format;
  const valueHolder = getComputed(() => formatter.get(cellContext.cell!));
  const nullValue = getComputed(() => formatter.isNull(valueHolder));
  const displayValue = getComputed(() => formatter.getDisplayString(valueHolder));

  if (nullValue) {
    return <GridNullFormatter />;
  }

  let value = displayValue;

  if (formattingContext.formatters) {
    const extendedDateKind = formattingContext.getExtendedDateKind(cellContext.cell.column);

    let dateFormatter: Intl.DateTimeFormat | null = null;
    switch (extendedDateKind) {
      case DateTimeKind.DateTime:
        dateFormatter = formattingContext.formatters.dateTime;
        break;
      case DateTimeKind.TimeOnly:
        dateFormatter = formattingContext.formatters.timeOnly;
        break;
      case DateTimeKind.DateOnly:
        dateFormatter = formattingContext.formatters.dateOnly;
        break;
    }
    if (dateFormatter) {
      if (DateTimeKind.TimeOnly === extendedDateKind) {
        const [h = 0, m = 0, s = 0] = displayValue.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, s, 0);
        value = dateFormatter.format(date);
      } else {
        const date = new Date(displayValue);
        value = dateFormatter.format(date);
      }
    }
  }

  return (
    <div className="tw:flex tw:items-center tw:overflow-hidden">
      <div className="tw:overflow-hidden tw:text-ellipsis">{value}</div>
    </div>
  );
});
