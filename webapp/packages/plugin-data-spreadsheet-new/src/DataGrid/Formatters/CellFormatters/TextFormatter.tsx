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
import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../../CellEditor/CellEditor';
import { DataGridContext } from '../../DataGridContext';

function getClasses(rawValue: any) {
  const classes = ['text-formatter'];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' '); // performance heavy
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
      <div className={classes}>
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

  const isUrl = typeof rawValue === 'string' && isValidUrl(rawValue);

  return (
    <div title={value} className={classes}>
      {isUrl && (
        <a href={rawValue} target='_blank' rel='noreferrer'>
          <IconOrImage icon='external-link' viewBox='0 0 24 24' />
        </a>
      )}
      <div className='text-formatter_value'>{value}</div>
    </div>
  );
});
