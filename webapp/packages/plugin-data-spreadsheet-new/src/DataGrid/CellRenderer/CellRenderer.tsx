/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import type { CellRendererProps } from 'react-data-grid';
import { Cell } from 'react-data-grid';
import styled, { css, use } from 'reshadow';

import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';

const styles = css`
  Cell[|selected] {
    background-color: rgba(0, 145, 234, 0.3);
  }
`;

export const CellRenderer: React.FC<CellRendererProps<any>> = observer(function CellRenderer(props) {
  const gridSelectionContext = useContext(DataGridSelectionContext);
  if (!gridSelectionContext) {
    throw new Error('Grid selection context must be provided');
  }

  const { rowIdx, column } = props;
  const { isSelected, select } = gridSelectionContext;

  const selected = isSelected(column.key, rowIdx);

  const onClickHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    select(column.key, rowIdx, event.ctrlKey, event.shiftKey);
  }, [column, rowIdx, select]);

  return styled(styles)(
    <Cell onClick={onClickHandler} {...use({ selected })} {...props} />
  );
});
