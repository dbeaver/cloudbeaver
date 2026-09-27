/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import { observer } from 'mobx-react-lite';

import { MenuItemElementStyles, s, SContext, useS, type StyleRegistry } from '@cloudbeaver/core-blocks';
import { ContextMenu } from '@cloudbeaver/core-ui';

import type { IDataGridMenu } from './useDataGridMenu.js';
import { DataGridContext } from '../DataGridContext.js';
import classes from './CellMenu.module.css';

const registry: StyleRegistry = [
  [
    MenuItemElementStyles,
    {
      mode: 'append',
      styles: [classes],
    },
  ],
];

interface Props {
  menu: IDataGridMenu;
}

export const CellMenu = observer<Props>(function CellMenu({ menu }) {
  const style = useS(classes);

  const gridContext = useContext(DataGridContext);

  function handleVisibleSwitch(visible: boolean) {
    if (!visible) {
      gridContext.focus();
    }
  }

  return (
    <SContext registry={registry}>
      <div className={s(style, { contextMenu: true })}>
        <ContextMenu menu={menu.menu} contextMenuPosition={menu.position} autoFocusOnShow onVisibleSwitch={handleVisibleSwitch} />
      </div>
    </SContext>
  );
});
