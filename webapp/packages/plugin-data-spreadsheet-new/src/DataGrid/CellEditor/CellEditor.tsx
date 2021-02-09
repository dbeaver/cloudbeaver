/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { EditorProps } from 'react-data-grid';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import styled, { css } from 'reshadow';

import { InlineEditor } from '@cloudbeaver/core-app';

import { DataGridContext } from '../DataGridContext';

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
  const context = useContext(DataGridContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
  const popper = usePopper(elementRef, popperRef, {
    placement: 'right',
  });

  if (!context) {
    throw new Error('DataGridContext should be provided');
  }

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useLayoutEffect(() => {
    if (elementRef && popperRef) {
      const size = elementRef.parentElement?.parentElement?.getBoundingClientRect();

      if (size) {
        popperRef.style.width = (size.width + 1) + 'px';
        popperRef.style.height = (size.height + 1) + 'px';
      }
    }
  });

  const value = row[column.key];

  const handleSave = () => onClose(false);
  const handleReject = () => {
    context.model.source.getEditor(context.resultIndex)
      .revertCell(rowIdx, Number(column.key));
    onClose(false);
  };
  const handleChange = (value: string) => {
    context.model.source.getEditor(context.resultIndex)
      .setCell(rowIdx, Number(column.key), value);
  };
  const handleUndo = () => {
    context.model.source.getEditor(context.resultIndex)
      .revertCell(rowIdx, Number(column.key));
    onClose(false);
  };

  return styled(styles)(
    <box ref={setElementRef} as='div'>
      {createPortal((
        <editor ref={setPopperRef} as="div" style={popper.styles.popper} {...popper.attributes.popper}>
          <InlineEditor
            ref={inputRef}
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value}
            edited
            hideSave
            hideCancel
            autofocus
            active
            onSave={handleSave}
            onReject={handleReject}
            onChange={handleChange}
            onUndo={handleUndo}
          />
        </editor>
      ), context.getEditorPortal()!)}
    </box>
  );
}, { forwardRef: true });
