/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { use } from 'react';
import classes from './textEditor.module.css';
import { DataGridCellContext } from '../DataGridCellContext.js';

function autoFocusAndSelect(input: HTMLInputElement | null) {
  input?.focus();
  input?.select();
}

export interface IProps {
  rowIdx: number;
  colIdx: number;
  onClose: () => void;
}

export default function textEditor({ rowIdx, colIdx, onClose }: IProps) {
  const cellContext = use(DataGridCellContext);

  const value = cellContext?.getCellText?.(rowIdx, colIdx) ?? '';

  return (
    <input
      className={classes['editor']}
      ref={autoFocusAndSelect}
      value={value}
      onChange={event => cellContext?.onCellChange?.(rowIdx, colIdx, event.target.value)}
      onBlur={() => onClose()}
    />
  );
}
