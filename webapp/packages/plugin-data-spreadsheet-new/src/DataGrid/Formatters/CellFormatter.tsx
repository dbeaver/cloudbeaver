/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { use, useContext } from 'react';
import { DataGridCellInnerContext } from '@cloudbeaver/plugin-data-grid';

import { getComputed, s, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import type { IDataPresentationActions, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../CellRenderer/CellContext.js';
import { DataGridContext } from '../DataGridContext.js';
import { TableDataContext } from '../TableDataContext.js';
import style from './CellFormatter.module.css';
import { CellFormatterFactory } from './CellFormatterFactory.js';
import { CellMenu } from './Menu/CellMenu.js';

interface Props {
  rowIdx: number;
  colIdx: number;
}

export const CellFormatter = observer<Props>(function CellFormatter({ rowIdx, colIdx }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const innerCellContext = use(DataGridCellInnerContext);
  const cellContext = useContext(CellContext);

  const cell = cellContext.cell;
  const showCellMenu = getComputed(
    () => !!cell && (innerCellContext?.isFocused || cellContext.isFocused || cellContext.isHovered || cellContext.isMenuVisible),
  );
  const styles = useS(style);

  const spreadsheetActions = useObjectRef<IDataPresentationActions<IResultSetElementKey>>({
    edit(position) {
      const colIdx = tableDataContext.getColumnIndexFromColumnKey(position.column);
      const rowIdx = tableDataContext.getRowIndexFromKey(position.row);

      if (colIdx !== -1) {
        context.getDataGridApi()?.openEditor({ colIdx, rowIdx });
      }
    },
  });

  function handleCellMenuStateSwitch(visible: boolean): void {
    cellContext.setMenuVisibility(visible);
  }

  return (
    <div className={s(styles, { wrapper: true })}>
      <div className={s(styles, { container: true })}>
        <CellFormatterFactory rowIdx={rowIdx} colIdx={colIdx} />
      </div>
      {showCellMenu && (
        <div className={s(styles, { menuContainer: true })}>
          <CellMenu
            cellKey={cell!}
            model={context.model}
            actions={context.actions}
            spreadsheetActions={spreadsheetActions}
            resultIndex={context.resultIndex}
            simple={context.simple}
            onStateSwitch={handleCellMenuStateSwitch}
          />
        </div>
      )}
    </div>
  );
});
