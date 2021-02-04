/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useLayoutEffect, useState } from 'react';
import type { EditorProps } from 'react-data-grid';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import styled, { css } from 'reshadow';

import { InlineEditor, InlineEditorControls } from '@cloudbeaver/core-app';

import { DataGridContext } from '../DataGridContext';

const styles = css`
  editor {
    composes: theme-typography--body2 from global;
  }
  InlineEditor {
    font-size: 12px;
    left: -1px;
  }
`;

export const CellEditor: React.FC<EditorProps<any, any>> = observer(function CellEditor({
  rowIdx,
  row,
  column,
  editorPortalTarget,
  onClose,
}) {
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
  const popper = usePopper(elementRef, popperRef, {
    placement: 'right',
  });
  const context = useContext(DataGridContext);

  useLayoutEffect(() => {
    if (elementRef && popperRef) {
      const size = elementRef.parentElement?.getBoundingClientRect();
      if (size) {
        popperRef.style.width = (size.width + 2) + 'px';
        popperRef.style.height = (size.height + 2) + 'px';
      }
    }
  });

  if (!context) {
    throw new Error('DataGridContext should be provided');
  }
  const modelResultData = context.model?.getResult(context.resultIndex);

  const value = row[column.key];

  const isLastColumn = column.isLastFrozenColumn; // TODO: do not work
  const isLastRow = rowIdx > 0 && ((modelResultData?.data.rows.length || 0) - 1 === rowIdx);
  let controlsPosition: InlineEditorControls = 'right';

  if (isLastColumn) {
    controlsPosition = isLastRow ? 'top' : 'bottom';
  }

  const handleSave = () => onClose(false);
  const handleReject = () => onClose(false);
  const handleChange = () => {};
  const handleUndo = () => onClose(false);

  return styled(styles)(
    <box ref={setElementRef} as='div'>
      {createPortal((
        <editor ref={setPopperRef} as="div" style={popper.styles.popper} {...popper.attributes.popper}>
          <InlineEditor
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value}
            controlsPosition={controlsPosition}
            edited
            hideSave
            hideCancel
            autofocus
            onSave={handleSave}
            onReject={handleReject}
            onChange={handleChange}
            onUndo={handleUndo}
          />
        </editor>
      ), context.getEditorPortal() || editorPortalTarget)}
    </box>
  );
});
