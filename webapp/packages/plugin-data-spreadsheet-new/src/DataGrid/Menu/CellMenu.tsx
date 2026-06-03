/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { MenuItemElementStyles, s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { ContextMenu } from '@cloudbeaver/core-ui';

import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';
import classes from './CellMenu.module.css';
import { DataGridContext } from '../DataGridContext.js';

const registry: StyleRegistry = [
  [
    MenuItemElementStyles,
    {
      mode: 'append',
      styles: [classes],
    },
  ],
];

export const CellMenu = observer(function CellMenu() {
  const style = useS(classes);
  const tableMenuContext = useContext(TableMenuContext);
  const menu = tableMenuContext.menu;
  const gridContext = useContext(DataGridContext);

  function handleStateSwitch(visible: boolean) {
    if (!visible) {
      tableMenuContext.closeMenu();
      gridContext.focus();
    }
  }

  return (
    <SContext registry={registry}>
      <ContextMenu
        className={s(style, { contextMenu: true })}
        menu={menu}
        contextMenuPosition={tableMenuContext.menuPosition}
        autoFocusOnShow
        onVisibleSwitch={handleStateSwitch}
      />
    </SContext>
  );
});
