/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type PropsWithChildren, useContext, useEffect } from 'react';

import { DataGridContext } from '../DataGridContext.js';
import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';
import { CellMenu } from './CellMenu.js';
import type { IDataGridMenu } from './useDataGridMenu.js';

interface Props {
  menu: IDataGridMenu;
}

export const DataGridMenuContextProvider = observer<PropsWithChildren<Props>>(function DataGridMenuContextProvider({ menu, children }) {
  const gridContext = useContext(DataGridContext);
  const container = gridContext.getScrollContainer();

  function handleScroll() {
    menu.closeMenu();
  }

  useEffect(() => {
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleScroll, { capture: true });

    return () => {
      container.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [container]);

  return (
    <TableMenuContext.Provider value={menu}>
      {children}
      <CellMenu menu={menu} />
    </TableMenuContext.Provider>
  );
});
