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

import { getComputed, Icon, s, useS } from '@cloudbeaver/core-blocks';
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
    const rect = event.currentTarget.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    cellContext.setMenuVisibility(true, { x: rect.right - 20, y: rect.bottom });
  }

  return (
    <div className={s(styles, { wrapper: true })}>
      <div className={s(styles, { container: true })}>
        <CellFormatterFactory rowIdx={rowIdx} colIdx={colIdx} />
      </div>
      {showCellMenu && (
        <button
          className={s(styles, { menuTrigger: true })}
          onDoubleClick={stopPropagation}
          onMouseUp={handleMenuTriggerMouseUp}
          onClick={handleMenuTriggerClick}
        >
          <Icon name="snack" viewBox="0 0 16 10" />
        </button>
      )}
    </div>
  );
});
