/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { use } from 'react';
import classes from './TextEditor.module.css';
import { DataGridCellContext } from '../DataGridCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';

function autoFocusAndSelect(input: HTMLTextAreaElement | null) {
  if (!input) {
    return;
  }
  input.focus();
  input.select();

  input.addEventListener(
    'beforeinput',
    e => {
      if (e.inputType === 'insertLineBreak') {
        e.preventDefault();
      }
    },
    { once: true },
  );
}

export interface IProps {
  rowIdx: number;
  colIdx: number;
  onClose: () => void;
}

export function TextEditor({ rowIdx, colIdx, onClose }: IProps) {
  const cellContext = use(DataGridCellContext);

  const value = useGridReactiveValue(cellContext?.cellText, rowIdx, colIdx) ?? '';

  return (
    <textarea
      ref={autoFocusAndSelect}
      className={classes['editor']}
      rows={1}
      value={value}
      onChange={event => cellContext?.onCellChange?.(rowIdx, colIdx, event.target.value)}
      onBlur={() => onClose()}
    />
  );
}
