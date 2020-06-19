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
    const inputRef = useRef<HTMLInputElement>(null);
    const [, forceUpdate] = useState();
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
    const special = useRef(value.current);

    useImperativeHandle(ref, () => ({
      getValue: () => special.current,
    }), []);

    useEffect(() => inputRef.current?.focus(), []);

    const context: AgGridContext = props.context;

    const handleSave = useCallback(() => {
      special.current = value.current;
      props.stopEditing();

      // we use this setTimeout to update changes before saving
      setTimeout(() => {
        context.onEditSave();
      }, 1);
    }, [props.stopEditing]);

    const handleReject = useCallback(() => props.api?.stopEditing(true), [props.api?.stopEditing]);
    const handleChange = useCallback((newValue: string) => {
      value.current = newValue;
      forceUpdate(newValue);
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
          value={value.current}
          onSave={handleSave}
          onReject={handleReject}
          onChange={handleChange}
          controlsPosition={controlsPosition}
        />
      </editor>
    );
  }
);
