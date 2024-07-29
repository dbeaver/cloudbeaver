/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';
import { useMenuState } from 'reakit';

import { getComputed, s, useMouseContextMenu, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import type { RenderCellProps } from '@cloudbeaver/plugin-data-grid';
import type { IDataPresentationActions, IResultSetElementKey, IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { CellContext } from '../CellRenderer/CellContext';
import { DataGridContext } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';
import style from './CellFormatter.module.css';
import { CellFormatterFactory } from './CellFormatterFactory';
import { CellMenu } from './Menu/CellMenu';

interface Props extends RenderCellProps<IResultSetRowKey> {
  className?: string;
}

export const CellFormatter = observer<Props>(function CellFormatter({ className, ...rest }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const editingContext = useContext(EditingContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const isEditing = cellContext.isEditing;
  const showCellMenu = getComputed(() => !isEditing && (cellContext.isFocused || cellContext.mouse.state.mouseEnter || menuVisible));
  const styles = useS(style);
  const menu = useMenuState({ modal: true });
  const mouseContextMenu = useMouseContextMenu();

  const spreadsheetActions = useObjectRef<IDataPresentationActions<IResultSetElementKey>>({
    edit(position) {
      const idx = tableDataContext.getColumnIndexFromColumnKey(position.column);
      const rowIdx = tableDataContext.getRowIndexFromKey(position.row);

      if (idx !== -1) {
        editingContext.edit({ idx, rowIdx });
      }
    },
  });

  function onContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    if (!showCellMenu) {
      return;
    }

    menu.hide();
    mouseContextMenu.handleContextMenuOpen(event);
    menu.show();
  }

  return (
    <div className={s(styles, { wrapper: true }, className)} onContextMenu={onContextMenu}>
      <div className={s(styles, { container: true })}>
        <CellFormatterFactory {...rest} isEditing={isEditing} />
      </div>
      {showCellMenu && cellContext.cell && (
        <div className={s(styles, { menuContainer: true })}>
          <CellMenu
            menu={menu}
            cellKey={cellContext.cell}
            model={context.model}
            actions={context.actions}
            spreadsheetActions={spreadsheetActions}
            resultIndex={context.resultIndex}
            simple={context.simple}
            onStateSwitch={setMenuVisible}
          />
        </div>
      )}
    </div>
  );
});
