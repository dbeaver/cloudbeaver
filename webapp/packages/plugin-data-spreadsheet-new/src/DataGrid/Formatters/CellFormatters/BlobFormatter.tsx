/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import type { IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';
import type { RenderCellProps } from '@cloudbeaver/plugin-react-data-grid';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellContext } from '../../CellRenderer/CellContext';
import { DataGridContext } from '../../DataGridContext';
import { TableDataContext } from '../../TableDataContext';
import style from './BlobFormatter.m.css';

export const BlobFormatter = observer<RenderCellProps<IResultSetRowKey>>(function BlobFormatter({ column, row }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const editingContext = useContext(EditingContext);
  const cellContext = useContext(CellContext);
  const cell = cellContext.cell;

  if (!context || !tableDataContext || !editingContext || !cell) {
    throw new Error('Contexts required');
  }

  const styles = useS(style);

  const formatter = tableDataContext.format;
  const rawValue = getComputed(() => formatter.get(cell));
  const displayString = getComputed(() => formatter.getDisplayString(cell));

  const nullValue = rawValue === null;
  const disabled = !column.editable || editingContext.readonly || formatter.isReadOnly(cell);
  const readonly = tableDataContext.isCellReadonly(cell);

  return (
    <span className={s(styles, { blobFormatter: true, nullValue })} title={displayString}>
      <div className={s(style, { blobFormatterValue: true })}>{displayString}</div>
    </span>
  );
});
