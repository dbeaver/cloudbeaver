/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect, useRef } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled from 'reshadow';

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../../CellEditor/CellEditor';
import { DataGridContext } from '../../DataGridContext';

function getClasses(rawValue: any) {
  const classes = [];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' ');
}

export const TextFormatter: React.FC<FormatterProps> = observer(function TextFormatter({ rowIdx, row, column, isCellSelected }) {
  const editorRef = useRef<IEditorRef>(null);
  const context = useContext(DataGridContext);
  const editingContext = useContext(EditingContext);
  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const rawValue = formatter?.get(row[column.key]) ?? row[column.key];
  const classes = getClasses(rawValue);
  const value = formatter?.toDisplayString(rawValue) ?? String(rawValue);

  const handleClose = useCallback(() => {
    editingContext?.closeEditor({ idx: column.idx, rowIdx });
  }, [column, rowIdx]);

  useEffect(() => {
    if (isCellSelected) {
      if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
        editorRef.current?.focus();
      }
    }
  }, [isCellSelected]);

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    return (
      <div className={`text-formatter ${classes}`}>
        <CellEditor
          ref={editorRef}
          rowIdx={rowIdx}
          row={row}
          column={column}
          onClose={handleClose}
        />
      </div>
    );
  }

  return styled()(
    <text-formatter title={value} className={`text-formatter ${classes}`}>
      {value}
    </text-formatter>
  );
});
