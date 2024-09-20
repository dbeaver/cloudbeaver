/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

import { s, useS } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { InlineEditor } from '@cloudbeaver/core-ui';
import { type RenderEditCellProps } from '@cloudbeaver/plugin-data-grid';
import type { IResultSetElementKey, IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import style from './CellEditor.module.css';
import { DataGridContext, type IColumnResizeInfo } from './DataGridContext.js';
import { TableDataContext } from './TableDataContext.js';

export interface IEditorRef {
  focus: () => void;
}

const lockNavigation = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'];

export const CellEditor = observer<Pick<RenderEditCellProps<IResultSetRowKey>, 'row' | 'column' | 'onClose'>, IEditorRef>(
  forwardRef(function CellEditor({ row, column, onClose }, ref) {
    const dataGridContext = useContext(DataGridContext);
    const tableDataContext = useContext(TableDataContext);
    const inputRef = useRef<HTMLInputElement>(null);
    const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
    const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
    const popper = usePopper(elementRef, popperRef, {
      placement: 'right',
      modifiers: [{ name: 'flip', enabled: false }],
    });
    const styles = useS(style);

    if (!dataGridContext || !tableDataContext || column.columnDataIndex === null) {
      throw new Error('DataGridContext should be provided');
    }

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      function resize(data: IColumnResizeInfo) {
        if (elementRef && popperRef && data.column === column.idx) {
          popperRef.style.width = data.width + 1 + 'px';
        }
      }

      dataGridContext.columnResize.addHandler(resize);

      return () => dataGridContext.columnResize.removeHandler(resize);
    }, [elementRef, popperRef, column]);

    useLayoutEffect(() => {
      if (elementRef && popperRef) {
        const size = elementRef.closest('[role="gridcell"]')?.getBoundingClientRect();

        if (size) {
          popperRef.style.width = size.width + 1 + 'px';
          popperRef.style.height = size.height + 1 + 'px';
        }
      }
    });

    const cellKey: IResultSetElementKey = { row, column: column.columnDataIndex };

    const value = tableDataContext.format.getText(cellKey);

    const handleSave = () => onClose(false);
    const handleReject = () => {
      tableDataContext.editor.revert(cellKey);
      onClose(false);
    };
    const handleChange = (value: string) => {
      tableDataContext.editor.set(cellKey, value);
    };
    const handleUndo = () => {
      tableDataContext.editor.revert(cellKey);
      onClose(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (lockNavigation.includes(event.key)) {
        event.stopPropagation();
      }
    };

    const preventClick = (event: React.MouseEvent<HTMLDivElement>) => {
      EventContext.set(event, EventStopPropagationFlag); // better but not works
      event.stopPropagation();
    };

    const editorPortal = dataGridContext.getEditorPortal();

    return (
      <div
        ref={setElementRef}
        className={s(styles, { box: true })}
        onKeyDown={handleKeyDown}
        onClick={preventClick}
        onDoubleClick={preventClick}
        onMouseDown={preventClick}
        onMouseUp={preventClick}
      >
        {editorPortal &&
          createPortal(
            <div ref={setPopperRef} className={s(styles, { editor: true })} style={popper.styles['popper']} {...popper.attributes['popper']}>
              <InlineEditor
                ref={inputRef}
                value={value}
                controlsPosition="inside"
                className={s(styles, { inlineEditor: true })}
                edited
                hideSave
                hideCancel
                autofocus
                active
                simple
                onBlur={handleSave}
                onSave={handleSave}
                onReject={handleReject}
                onChange={handleChange}
                onUndo={handleUndo}
              />
            </div>,
            editorPortal,
          )}
      </div>
    );
  }),
);
