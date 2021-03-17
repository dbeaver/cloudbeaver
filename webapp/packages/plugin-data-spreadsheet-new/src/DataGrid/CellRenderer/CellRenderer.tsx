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

  if (selectionContext?.isSelected(rowIdx, column.idx)) {
    classes.push('rdg-cell-custom-selected');
  }

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    classes.push('rdg-cell-custom-editing');
  }

  if (editor?.isCellEdited(rowIdx, Number(column.key))) {
    classes.push('rdg-cell-custom-edited');
  }

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    selectionContext?.select(
      {
        colIdx: column.idx,
        rowIdx,
      },
      event.ctrlKey || event.metaKey,
      event.shiftKey,
      true
    );
  }, [column, rowIdx, selectionContext]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    selectionContext?.select(
      {
        colIdx: column.idx,
        rowIdx,
      },
      event.ctrlKey || event.metaKey,
      event.shiftKey,
      false
    );
  }, [column, rowIdx, selectionContext]);

  const handleDoubleClick = useCallback(() => {
    if (!column.editable) {
      return;
    }

    const cellValue = props.row[column.key];

    if (cellValue !== null && typeof cellValue === 'object') {
      return;
    }

    editingContext?.edit({ idx: column.idx, rowIdx });
  }, [column, rowIdx, props.row]);

  const row = editor?.get(rowIdx) || props.row;

  return (
    <Cell
      className={classes.join(' ')}
      data-row-index={rowIdx}
      data-column-index={column.idx}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      {...props}
      row={[...row]}
    />
  );
});
