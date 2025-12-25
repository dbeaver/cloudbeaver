/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import { NullFormatter as GridNullFormatter } from '@cloudbeaver/plugin-data-grid';

import { CellContext } from '../../CellRenderer/CellContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import styles from './DateTimeFormatter.module.css';
import type { ICellFormatterProps } from '../ICellFormatterProps.js';

export const DateTimeFormatter = observer<ICellFormatterProps>(function DateTimeFormatter() {
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const style = useS(styles);

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

  if (tableDataContext.useUserFormatting) {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(displayValue);
    const date = new Date(displayValue);

    if (!isNaN(date.getTime())) {
      let formatter = tableDataContext.useUserFormatting.dateTime;

      if (isDateOnly) {
        formatter = tableDataContext.useUserFormatting.dateOnly;
      }

      value = formatter.format(date);
    }
  }

  return (
    <div className={s(style, { dateFormatter: true })}>
      <div className={s(style, { dateFormatterValue: true })}>{value}</div>
    </div>
  );
});
