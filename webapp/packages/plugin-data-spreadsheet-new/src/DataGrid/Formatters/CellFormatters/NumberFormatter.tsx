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
import type { ICellFormatterProps } from '../ICellFormatterProps.js';

import styles from './NumberFormatter.module.css';

export const NumberFormatter = observer<ICellFormatterProps>(function NumberFormatter() {
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
    const numberValue = Number(displayValue);

    if (!isNaN(numberValue) && displayValue.trim() !== '') {
      value = tableDataContext.useUserFormatting.number.format(numberValue);
    }
  }

  return (
    <div className={s(style, { numberFormatter: true })}>
      <div className={s(style, { numberFormatterValue: true })}>{value}</div>
    </div>
  );
});
