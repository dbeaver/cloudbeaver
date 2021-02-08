/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import type { CellRendererProps } from 'react-data-grid';
import { Cell } from 'react-data-grid';

import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';

export const CellRenderer: React.FC<CellRendererProps<any>> = observer(function CellRenderer(props) {
  const gridSelectionContext = useContext(DataGridSelectionContext);
  if (!gridSelectionContext) {
    throw new Error('Grid selection context must be provided');
  }

  let classes = '';
  const { rowIdx, column } = props;
  const { isSelected, select } = gridSelectionContext;

  if (isSelected(column.key, rowIdx)) {
    classes += 'rdg-cell-custom-selected';
  }

  const onClickHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    select(column.key, rowIdx, event.ctrlKey, event.shiftKey);
  }, [column, rowIdx, select]);

  return (
    <Cell className={classes} onClick={onClickHandler} {...props} />
  );
});
