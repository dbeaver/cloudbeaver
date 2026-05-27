/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, type PropsWithChildren } from 'react';

import { useContextMenuPosition, useObservableRef } from '@cloudbeaver/core-blocks';

import { DataGridContext } from '../DataGridContext.js';
import type { ICellContext } from '../CellRenderer/CellContext.js';
import { TableMenuContext, type ITableMenuContext } from '../CellRenderer/TableMenuContext.js';
import { CellMenu } from './CellMenu.js';

interface Props {
  onClose: () => void;
}

export const DataGridMenuContextProvider = observer<PropsWithChildren<Props>>(function DataGridMenuContextProvider({ onClose, children }) {
  const menuPosition = useContextMenuPosition();
  const dataGridContext = useContext(DataGridContext);

  const tableMenuState = useObservableRef<ITableMenuContext>(
    () => ({
      activeCell: null,
      menuPosition,
      get isMenuOpened() {
        return this.menuPosition.position !== null;
      },
      openMenu(cellContext: ICellContext, event: React.MouseEvent) {
        this.activeCell = cellContext.cell;
        this.menuPosition.open(event);
      },
      closeMenu() {
        this.activeCell = null;
        this.menuPosition.close();
      },
    }),
    {
      activeCell: observable.ref,
      menuPosition: observable.ref,
      isMenuOpened: computed,
      openMenu: action,
      closeMenu: action,
    },
    false,
  );

  useEffect(() => {
    const container = dataGridContext.getContainer();

    if (!container) {
      return;
    }

    function handleScroll() {
      tableMenuState.closeMenu();
    }

    container.addEventListener('scroll', handleScroll, { capture: true });
    return () => container.removeEventListener('scroll', handleScroll, { capture: true });
  }, [dataGridContext, tableMenuState]);

  return (
    <TableMenuContext.Provider value={tableMenuState}>
      {children}
      <CellMenu onClose={onClose} />
    </TableMenuContext.Provider>
  );
});
