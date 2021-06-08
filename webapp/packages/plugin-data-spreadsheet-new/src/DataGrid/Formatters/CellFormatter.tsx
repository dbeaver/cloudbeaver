/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled from 'reshadow';

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { CellEditor, IEditorRef } from '../CellEditor/CellEditor';
import { CellContext } from '../CellRenderer/CellContext';
import { DataGridContext } from '../DataGridContext';
import { CellMenu } from './Menu/CellMenu';

function getClasses(rawValue: any) {
  const classes = [];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' ');
}

export const CellFormatter: React.FC<FormatterProps> = observer(function CellFormatter({ rowIdx, row, column, isCellSelected }) {
  const editorRef = useRef<IEditorRef>(null);
  const cellContext = useContext(CellContext);
  const context = useContext(DataGridContext);
  const editingContext = useContext(EditingContext);
  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const rawValue = formatter?.get(row[column.key]) ?? row[column.key];
  const classes = getClasses(rawValue);
  const [menuVisible, setMenuVisible] = useState(false);
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

  return styled()(
    <>
      <cell-formatter title={value} className={`cell-formatter ${classes}`}>
        {value}
      </cell-formatter>
      {(isCellSelected || cellContext?.mouse.state.mouseEnter || menuVisible) && context && (
        <CellMenu
          model={context.model}
          resultIndex={context.resultIndex}
          row={rowIdx}
          column={Number(column.key)}
          onStateSwitch={setMenuVisible}
        />
      )}
    </>
  );
});
