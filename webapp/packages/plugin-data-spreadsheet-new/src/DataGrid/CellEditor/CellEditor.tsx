/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { EditorProps } from 'react-data-grid';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import styled, { css } from 'reshadow';

import { InlineEditor } from '@cloudbeaver/core-app';
import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext, IColumnResizeInfo } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';

const styles = css`
  editor {
    composes: theme-typography--body2 from global;
  }
  box {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 100%;
  }
  InlineEditor {
    font-size: 12px;
    left: -1px;
  }
`;

export interface IEditorRef {
  focus: () => void;
}

export const CellEditor = observer<Pick<EditorProps<any, any>, 'rowIdx' | 'row' | 'column' | 'onClose'>, IEditorRef>(function CellEditor({
  rowIdx,
  row,
  column,
  onClose,
}, ref) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
  const formatter = dataGridContext?.model.source.getAction(dataGridContext.resultIndex, ResultSetFormatAction);
  const popper = usePopper(elementRef, popperRef, {
    placement: 'right',
  });

  if (!dataGridContext || !tableDataContext) {
    throw new Error('DataGridContext should be provided');
  }

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    function resize(data: IColumnResizeInfo) {
      if (elementRef && popperRef && data.column === column.idx) {
        popperRef.style.width = (data.width + 1) + 'px';
      }
    }

    dataGridContext.columnResize.addHandler(resize);

    return () => dataGridContext.columnResize.removeHandler(resize);
  }, [elementRef, popperRef, column]);

  useLayoutEffect(() => {
    if (elementRef && popperRef) {
      const size = elementRef.closest('[role="gridcell"]')?.getBoundingClientRect();

      if (size) {
        popperRef.style.width = (size.width + 1) + 'px';
        popperRef.style.height = (size.height + 1) + 'px';
      }
    }
  });

  const value = formatter?.getText(row[column.key]) ?? '';

  const handleSave = () => onClose(false);
  const handleReject = () => {
    dataGridContext.model.source.getEditor(dataGridContext.resultIndex)
      .revertCell(rowIdx, Number(column.key));
    onClose(false);
  };
  const handleChange = (value: string) => {
    dataGridContext.model.source.getEditor(dataGridContext.resultIndex)
      .setCell(rowIdx, Number(column.key), value);
  };
  const handleUndo = () => {
    dataGridContext.model.source.getEditor(dataGridContext.resultIndex)
      .revertCell(rowIdx, Number(column.key));
    onClose(false);
  };

  return styled(styles)(
    <box ref={setElementRef} as='div'>
      {createPortal((
        <editor ref={setPopperRef} as="div" style={popper.styles.popper} {...popper.attributes.popper}>
          <InlineEditor
            ref={inputRef}
            type="text"
            value={value}
            edited
            hideSave
            hideCancel
            autofocus
            active
            simple
            onSave={handleSave}
            onReject={handleReject}
            onChange={handleChange}
            onUndo={handleUndo}
          />
        </editor>
      ), dataGridContext.getEditorPortal()!)}
    </box>
  );
}, { forwardRef: true });
