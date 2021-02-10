/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useContext, useEffect, useRef } from 'react';
import type { FormatterProps } from 'react-data-grid';

import { EditingContext } from '../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../CellEditor/CellEditor';

function valueGetter(rawValue: any) {
  if (rawValue !== null && typeof rawValue === 'object') {
    return JSON.stringify(rawValue);
  }

  return rawValue;
}

function formatValue(rawValue: any) {
  const value = valueGetter(rawValue);

  if (typeof value === 'string' && value.length > 1000) {
    return value.split('').map(v => (v.charCodeAt(0) < 32 ? ' ' : v)).join('');
  }

  if (value === null) {
    return '[null]';
  }

  return String(value);
}

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
  const editingContext = useContext(EditingContext);
  const rawValue = row[column.key];
  const classes = getClasses(rawValue);
  const value = formatValue(rawValue);

  const handleClose = useCallback(() => {
    editingContext?.closeEditor({ idx: column.idx, rowIdx });
  }, [column, rowIdx]);

  useEffect(() => {
    if (isCellSelected) {
      if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
        editorRef.current?.focus();
      }
    }
  });

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
    <cell-formatter ref={cellRef} as='div' className={`cell-formatter ${classes}`}>
      {value}
    </cell-formatter>
  );
};
