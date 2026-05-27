/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { use, useContext } from 'react';
import { DataGridCellInnerContext } from '@cloudbeaver/plugin-data-grid';

import { getComputed, IconButton, s, useS } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { CellContext } from '../CellRenderer/CellContext.js';
import style from './CellFormatter.module.css';
import { CellFormatterFactory } from './CellFormatterFactory.js';

interface Props {
  rowIdx: number;
  colIdx: number;
}

export const CellFormatter = observer<Props>(function CellFormatter({ rowIdx, colIdx }) {
  const innerCellContext = use(DataGridCellInnerContext);
  const cellContext = useContext(CellContext);

  const cell = cellContext.cell;
  const showCellMenu = getComputed(() => !!cell && (innerCellContext?.isFocused || cellContext.isFocused || cellContext.isHovered));
  const styles = useS(style);

  function handleMenuTriggerMouseUp(event: React.MouseEvent<HTMLButtonElement>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  function stopPropagation(event: React.MouseEvent) {
    event.stopPropagation();
  }

  function handleMenuTriggerClick(event: React.MouseEvent<HTMLButtonElement>) {
    // detail === 0 means keyboard-triggered click (e.g. Enter/Space on the button).
    // Ignore these to prevent the menu from opening when the editor closes and focus
    // accidentally lands on this button.
    if (event.detail === 0) {
      return;
    }
    cellContext.openMenu(event);
  }

  return (
    <div className={s(styles, { wrapper: true })}>
      <div className={s(styles, { container: true })}>
        <CellFormatterFactory rowIdx={rowIdx} colIdx={colIdx} />
      </div>
      {showCellMenu && (
        <IconButton
          name="snack"
          viewBox="0 0 16 10"
          tabIndex={-1}
          className={s(styles, { menuTrigger: true })}
          onDoubleClick={stopPropagation}
          onMouseUp={handleMenuTriggerMouseUp}
          onClick={handleMenuTriggerClick}
        />
      )}
    </div>
  );
});
