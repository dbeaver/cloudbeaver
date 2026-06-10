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

import { getComputed, IconButton, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { CellContext } from '../CellRenderer/CellContext.js';
import style from './CellFormatter.module.css';
import { CellFormatterFactory } from './CellFormatterFactory.js';
import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';

interface Props {
  rowIdx: number;
  colIdx: number;
}

export const CellFormatter = observer<Props>(function CellFormatter({ rowIdx, colIdx }) {
  const innerCellContext = use(DataGridCellInnerContext);
  const cellContext = useContext(CellContext);
  const tableMenuContext = use(TableMenuContext);
  const translate = useTranslate();

  const cell = cellContext.cell;
  const showCellMenu = getComputed(
    () => !!cell && (innerCellContext?.isFocused || cellContext.isFocused || cellContext.isHovered || cellContext.isMenuVisible),
  );
  const styles = useS(style);

  function handleMouseUp(event: React.MouseEvent<HTMLButtonElement>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  function stopPropagation(event: React.MouseEvent) {
    event.stopPropagation();
  }

  function openMenu(event: React.MouseEvent<HTMLButtonElement>) {
    if (!cell) {
      return;
    }

    tableMenuContext.openMenu(cell, event);
  }

  return (
    <div className={s(styles, { wrapper: true })}>
      <div className={s(styles, { container: true })}>
        <CellFormatterFactory rowIdx={rowIdx} colIdx={colIdx} />
      </div>
      {showCellMenu && (
        <span>
          <IconButton
            name="snack"
            viewBox="0 0 16 16"
            tabIndex={-1}
            className={s(styles, { menuTrigger: true })}
            onDoubleClick={stopPropagation}
            onMouseUp={handleMouseUp}
            onClick={openMenu}
          />
          <span className="tw:sr-only">{translate('data_grid_table_context_menu_aria_label')}</span>
        </span>
      )}
    </div>
  );
});
