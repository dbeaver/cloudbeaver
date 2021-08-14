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

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { isValidUrl } from '@cloudbeaver/core-utils';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../../CellEditor/CellEditor';
import { DataGridContext } from '../../DataGridContext';
import { TableDataContext } from '../../TableDataContext';

function getClasses(rawValue: any) {
  const classes = ['text-formatter'];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' '); // performance heavy
}

export const TextFormatter: React.FC<FormatterProps> = observer(function TextFormatter({ rowIdx, column, isCellSelected }) {
  const editorRef = useRef<IEditorRef>(null);
  const context = useContext(DataGridContext);
  const editingContext = useContext(EditingContext);
  const tableDataContext = useContext(TableDataContext);

  if (!context || !tableDataContext || !editingContext || column.columnDataIndex === null) {
    throw new Error('Contexts required');
  }

  const formatter = tableDataContext.format;
  const rawValue = formatter.get(tableDataContext.getCellValue(rowIdx, column.columnDataIndex)!);
  const classes = getClasses(rawValue);
  const value = formatter.toDisplayString(rawValue);

  const handleClose = useCallback(() => {
    editingContext.closeEditor({ idx: column.idx, rowIdx });
  }, [column, rowIdx]);

  useEffect(() => {
    if (isCellSelected) {
      if (editingContext.isEditing({ idx: column.idx, rowIdx })) {
        editorRef.current?.focus();
      }
    }
  }, [isCellSelected]);

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    return (
      <div className={classes}>
        <CellEditor
          ref={editorRef}
          rowIdx={rowIdx}
          column={column}
          onClose={handleClose}
        />
      </div>
    );
  }

  const isUrl = typeof rawValue === 'string' && isValidUrl(rawValue);

  return (
    <div title={value} className={classes}>
      {isUrl && (
        <a href={rawValue as string} target='_blank' rel='noreferrer' draggable={false}>
          <IconOrImage icon='external-link' viewBox='0 0 24 24' />
        </a>
      )}
      <div className='text-formatter__value'>{value}</div>
    </div>
  );
});
