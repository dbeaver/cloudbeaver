/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useContext, useEffect, useRef } from 'react';
import type { FormatterProps } from 'react-data-grid';

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../CellEditor/CellEditor';
import { DataGridContext } from '../DataGridContext';

function getClasses(rawValue: any) {
  const classes = [];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' ');
}

export const CellFormatter: React.FC<FormatterProps> = function CellFormatter({ rowIdx, row, column, isCellSelected }) {
  const editorRef = useRef<IEditorRef>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const context = useContext(DataGridContext);
  const editingContext = useContext(EditingContext);
  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const rawValue = row[column.key];
  const classes = getClasses(rawValue);
  const value = formatter?.toString(rawValue) ?? String(rawValue);

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
      <div className={`cell-formatter ${classes}`}>
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

  return (
    <cell-formatter ref={cellRef} title={value} as='div' className={`cell-formatter ${classes}`}>
      {value}
    </cell-formatter>
  );
};
