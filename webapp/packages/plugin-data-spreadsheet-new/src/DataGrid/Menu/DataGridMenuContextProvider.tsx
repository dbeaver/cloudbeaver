/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';

import { useContextMenuPosition, useObservableRef } from '@cloudbeaver/core-blocks';
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import { TableMenuContext, type ITableMenuContext } from '../CellRenderer/TableMenuContext.js';
import { CellMenu } from './CellMenu.js';

interface Props {
  onClose: () => void;
}

export const DataGridMenuContextProvider = observer<PropsWithChildren<Props>>(function DataGridMenuContextProvider({ onClose, children }) {
  const menuPosition = useContextMenuPosition();

  const tableMenuState = useObservableRef<ITableMenuContext>(
    () => ({
      activeCellKey: null,
      menuPosition,
      openMenu(cellKey: IGridDataKey, x: number, y: number) {
        this.activeCellKey = cellKey;
        this.menuPosition.position = { x, y };
      },
      closeMenu() {
        this.activeCellKey = null;
        this.menuPosition.close();
      },
    }),
    {
      activeCellKey: observable.ref,
      menuPosition: observable.ref,
      openMenu: action,
      closeMenu: action,
    },
    false,
  );

  return (
    <TableMenuContext.Provider value={tableMenuState}>
      {children}
      <CellMenu onClose={onClose} />
    </TableMenuContext.Provider>
  );
});
