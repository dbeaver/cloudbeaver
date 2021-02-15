/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import type { CellRendererProps } from 'react-data-grid';
import { Cell } from 'react-data-grid';

import { EditingContext } from '../../Editing/EditingContext';
import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';

export const CellRenderer: React.FC<CellRendererProps<any>> = observer(function CellRenderer(props) {
  const context = useContext(DataGridContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const editingContext = useContext(EditingContext);
  const editor = context?.model.source.getEditor(context.resultIndex);

  const classes: string[] = [];
  const { rowIdx, column } = props;

  if (selectionContext?.isSelected(column.key, rowIdx)) {
    classes.push('rdg-cell-custom-selected');
  }

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    classes.push('rdg-cell-custom-editing');
  }

  if (editor?.isCellEdited(rowIdx, Number(column.key))) {
    classes.push('rdg-cell-custom-edited');
  }

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    selectionContext?.select(column.key, rowIdx, event.ctrlKey, event.shiftKey);
  }, [column, rowIdx, selectionContext]);

  const handleDoubleClick = useCallback(() => {
    editingContext?.edit({ idx: column.idx, rowIdx });
  }, [column, rowIdx]);

  const row = editor?.get(rowIdx) || props.row;

  return (
    <Cell
      className={classes.join(' ')}
      data-rowindex={rowIdx}
      data-columnkey={column.key}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      {...props}
      row={row}
    />
  );
});
