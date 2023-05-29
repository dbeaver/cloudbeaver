/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect, useRef } from 'react';

import { getComputed, IconOrImage } from '@cloudbeaver/core-blocks';
import { clsx, isValidUrl } from '@cloudbeaver/core-utils';
import type { IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';
import type { FormatterProps } from '@cloudbeaver/plugin-react-data-grid';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../../CellEditor/CellEditor';
import { CellContext } from '../../CellRenderer/CellContext';
import { TableDataContext } from '../../TableDataContext';

export const TextFormatter = observer<FormatterProps<IResultSetRowKey>>(function TextFormatter({ row, column, isCellSelected }) {
  const editorRef = useRef<IEditorRef>(null);
  const editingContext = useContext(EditingContext);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);

  if (!cellContext.cell) {
    throw new Error('Contexts required');
  }

  const formatter = tableDataContext.format;
  const rawValue = getComputed(() => formatter.get(tableDataContext.getCellValue(cellContext.cell!)!));

  const classes = clsx('text-formatter', { 'cell-null': rawValue === null });

  const value = formatter.toDisplayString(rawValue);

  const handleClose = useCallback(() => {
    editingContext.closeEditor(cellContext.position);
  }, [cellContext]);

  useEffect(() => {
    if (isCellSelected) {
      if (cellContext.isEditing) {
        editorRef.current?.focus();
      }
    }
  }, [isCellSelected]);

  if (cellContext.isEditing) {
    return (
      <div className={classes}>
        <CellEditor ref={editorRef} row={row} column={column} onClose={handleClose} />
      </div>
    );
  }

  const isUrl = typeof rawValue === 'string' && isValidUrl(rawValue);

  return (
    <div title={value} className={classes}>
      {isUrl && (
        <a href={rawValue as string} target="_blank" rel="noreferrer" draggable={false}>
          <IconOrImage icon="external-link" viewBox="0 0 24 24" />
        </a>
      )}
      <div className="text-formatter__value">{value}</div>
    </div>
  );
});
