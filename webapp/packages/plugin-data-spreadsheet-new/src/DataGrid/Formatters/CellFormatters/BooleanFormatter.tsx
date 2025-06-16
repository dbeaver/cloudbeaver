/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { BooleanFormatter as GridBooleanFormatter } from '@cloudbeaver/plugin-data-grid';
import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import { DatabaseEditChangeType } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../../CellRenderer/CellContext.js';
import { DataGridContext } from '../../DataGridContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import type { ICellFormatterProps } from '../ICellFormatterProps.js';
import styles from './BooleanFormatter.module.css';

export const BooleanFormatter = observer<ICellFormatterProps>(function BooleanFormatter() {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const style = useS(styles);

  const cell = cellContext.cell;

  if (!context || !tableDataContext || !cell) {
    return null;
  }

  const formatter = tableDataContext.format;
  const value = getComputed(() => formatter.get(cell));
  const textValue = getComputed(() => formatter.getText(cell));
  const booleanValue = getComputed(() => textValue.toLowerCase() === 'true');
  const disabled =
    context.model.isReadonly(context.resultIndex) || (formatter.isReadOnly(cell) && cellContext.editionState !== DatabaseEditChangeType.add);

  function toggleValue() {
    if (disabled || !tableDataContext || !cell) {
      return;
    }
    const resultColumn = tableDataContext.getColumnInfo(cell.column);

    if (!resultColumn) {
      return;
    }

    const nextValue = !resultColumn.required && value === false ? null : !booleanValue;

    tableDataContext.editor.set(cell, nextValue);
  }

  return (
    <GridBooleanFormatter className={s(style, { formatter: true })} value={value as boolean | null} onClick={toggleValue} onKeyDown={toggleValue} />
  );
});
