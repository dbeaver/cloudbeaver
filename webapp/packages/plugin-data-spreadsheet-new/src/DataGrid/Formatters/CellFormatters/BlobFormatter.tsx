/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import { isResultSetContentValue } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../../CellRenderer/CellContext.js';
import { DataGridContext } from '../../DataGridContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import style from './BlobFormatter.module.css';
import type { ICellFormatterProps } from '../ICellFormatterProps.js';

export const BlobFormatter = observer<ICellFormatterProps>(function BlobFormatter() {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const cell = cellContext.cell;
  const styles = useS(style);

  if (!context || !tableDataContext || !cell) {
    return null;
  }

  const formatter = tableDataContext.format;
  const rawValue = getComputed(() => formatter.get(cell));
  const displayString = getComputed(() => formatter.getDisplayString(cell));

  const nullValue = isResultSetContentValue(rawValue) ? rawValue.text === 'null' : rawValue === null;

  return (
    <span className={s(styles, { blobFormatter: true, nullValue })} title={displayString}>
      <div className={s(style, { blobFormatterValue: true })}>{displayString}</div>
    </span>
  );
});
