/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  forwardRef, useImperativeHandle, useState, useCallback, useRef, useEffect,
} from 'react';
import styled, { css } from 'reshadow';

import { ICellEditorParams, ICellEditorComp } from '@ag-grid-community/core';
import { InlineEditor, InlineEditorControls } from '@cloudbeaver/core-app';

import { AgGridContext } from '../AgGridContext';

const KEY_BACKSPACE = 8;
const KEY_DELETE = 46;

const styles = css`
  editor {
    position: absolute;
    left: 0;
    top: -1px;
    bottom: 0;
    width: 100%;
  }
`;

export const PlainTextEditor = forwardRef<Partial<ICellEditorComp>, ICellEditorParams>(
  function PlainTextEditor(props, ref) {
    const [_, forceUpdate] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [initValue] = useState(() => {
      if (props.keyPress === KEY_BACKSPACE || props.keyPress === KEY_DELETE) {
        return '';
      }
      if (props.charPress) {
        return props.charPress;
      }

      return props.value;
    });

    const value = useRef(initValue);

    useImperativeHandle(ref, () => ({
      getValue: () => value.current,
    }), []);

    useEffect(() => inputRef.current?.focus(), []);

    const context: AgGridContext = props.context;

    const handleSave = useCallback(() => props.stopEditing(), [props.stopEditing]);

    const handleReject = useCallback(() => {
      props.api?.stopEditing(true);
    }, [props.api?.stopEditing]);

    const handleUndo = useCallback(() => {
      props.api?.stopEditing(true);

      setTimeout(
        () => context.revertCellValue(props.rowIndex, props.column.getColId()),
        1
      );
    }, [props.api?.stopEditing]);

    const handleChange = useCallback((newValue: string) => {
      value.current = newValue;
      context.editCellValue(props.rowIndex, props.column.getColId(), newValue, true);
      forceUpdate(value.current);
    }, []);

    const isLastColumn = props.columnApi?.getAllGridColumns().slice(-1)[0] === props.column;
    const isLastRow = props.rowIndex > 0 && ((props.api?.getInfiniteRowCount() || -1) - 1 === props.rowIndex);
    let controlsPosition: InlineEditorControls = 'right';

    if (isLastColumn) {
      controlsPosition = isLastRow ? 'top' : 'bottom';
    }

    return styled(styles)(
      <editor as="div">
        <InlineEditor
          type={props.colDef.type === 'NUMERIC' ? 'number' : 'text'}
          value={value.current}
          onSave={handleSave}
          onReject={handleReject}
          onChange={handleChange}
          onUndo={handleUndo}
          controlsPosition={controlsPosition}
          edited
          hideSave
          hideCancel
          autofocus
        />
      </editor>
    );
  }
);
