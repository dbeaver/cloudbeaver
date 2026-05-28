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
import type { IMenuData } from '@cloudbeaver/core-view';

import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';
import classes from './CellMenu.module.css';

interface Props {
  menu: IMenuData;
}

const registry: StyleRegistry = [
  [
    MenuItemElementStyles,
    {
      mode: 'append',
      styles: [classes],
    },
  ],
];

export const CellMenu = observer<Props>(function CellMenu({ menu }) {
  const style = useS(classes);
  const tableMenuContext = useContext(TableMenuContext);

  function handleStateSwitch(visible: boolean) {
    if (!visible) {
      tableMenuContext.closeMenu();
    }
  }

  return (
    <SContext registry={registry}>
      <ContextMenu
        key={`${tableMenuContext.menuPosition.position?.x}-${tableMenuContext.menuPosition.position?.y}`}
        className={s(style, { contextMenu: true })}
        menu={menu}
        contextMenuPosition={tableMenuContext.menuPosition}
        autoFocusOnShow
        onVisibleSwitch={handleStateSwitch}
      />
    </SContext>
  );
});
