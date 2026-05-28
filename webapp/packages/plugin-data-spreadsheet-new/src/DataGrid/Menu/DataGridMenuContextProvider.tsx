/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type PropsWithChildren } from 'react';

import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';
import { CellMenu } from './CellMenu.js';
import type { IDataGridMenu } from './useDataGridMenu.js';

interface Props {
  menu: IDataGridMenu;
}

export const DataGridMenuContextProvider = observer<PropsWithChildren<Props>>(function DataGridMenuContextProvider({ menu, children }) {
  return (
    <TableMenuContext.Provider value={menu}>
      {children}
      <CellMenu menu={menu.menu} />
    </TableMenuContext.Provider>
  );
});
