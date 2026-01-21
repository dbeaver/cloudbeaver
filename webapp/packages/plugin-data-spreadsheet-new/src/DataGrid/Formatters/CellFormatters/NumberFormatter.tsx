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
import { useFormattingContext } from '../../FormattingContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import type { ICellFormatterProps } from '../ICellFormatterProps.js';

export const NumberFormatter = observer<ICellFormatterProps>(function NumberFormatter() {
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
    const numberValue = Number(displayValue);

    if (!isNaN(numberValue) && displayValue.trim() !== '') {
      value = formattingContext.formatters.number.format(numberValue);
    }
  }

  return (
    <div className="tw:flex tw:items-center tw:overflow-hidden">
      <div className="tw:overflow-hidden tw:text-ellipsis">{value}</div>
    </div>
  );
});
