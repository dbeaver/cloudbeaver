/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useTranslate } from '@cloudbeaver/core-blocks';
import { DataGridCellHeaderContext } from '@cloudbeaver/plugin-data-grid';
import { Menu, useMenuStore } from '@dbeaver/ui-kit';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

interface Props {
  colIdx: number;
}

export const TableHeaderCellIcon = observer<Props>(function TableHeaderCellIcon({ colIdx }) {
  const dataGridCellHeaderContext = useContext(DataGridCellHeaderContext);
  const translate = useTranslate();
  const store = useMenuStore();

  return (
    <Menu.Provider store={store}>
      <Menu.Button>
        <Menu.ButtonArrow />
      </Menu.Button>
      <Menu>
        <Menu.Item onClick={() => dataGridCellHeaderContext?.pinColumn?.(colIdx)}>{translate('data_grid_table_pin_column')}</Menu.Item>
        <Menu.Item onClick={() => dataGridCellHeaderContext?.unpinColumn?.(colIdx)}>{translate('data_grid_table_unpin_column')}</Menu.Item>
      </Menu>
    </Menu.Provider>
  );
});
