/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, IconOrImage, s, useS } from '@cloudbeaver/core-blocks';
import { isValidUrl } from '@cloudbeaver/core-utils';
import { NullFormatter as GridNullFormatter } from '@cloudbeaver/plugin-data-grid';

import { CellContext } from '../../CellRenderer/CellContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import styles from './TextFormatter.module.css';
import type { ICellFormatterProps } from '../ICellFormatterProps.js';

export const TextFormatter = observer<ICellFormatterProps>(function TextFormatter() {
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const style = useS(styles);

  if (!cellContext.cell) {
    return null;
  }

  const formatter = tableDataContext.format;
  const nullValue = getComputed(() => formatter.get(cellContext.cell!) === null);
  const textValue = getComputed(() => formatter.getText(cellContext.cell!));
  const displayValue = getComputed(() => formatter.getDisplayString(cellContext.cell!));

  if (nullValue) {
    return <GridNullFormatter />;
  }

  const classes = s(style, { textFormatter: true });

  return (
    <div title={displayValue} className={classes}>
      {isValidUrl(textValue) && (
        <a href={textValue} target="_blank" rel="noreferrer" draggable={false} className={s(style, { a: true })}>
          <IconOrImage icon="external-link" viewBox="0 0 24 24" className={s(style, { icon: true })} />
        </a>
      )}
      <div className={s(style, { textFormatterValue: true })}>{displayValue}</div>
    </div>
  );
});
