/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarGroupStyles, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { SQL_EXECUTION_PLAN_ACTIONS_MENU } from './SQL_EXECUTION_PLAN_ACTIONS_MENU.js';
import style from './SqlExecutionPlanActionsMenu.module.css';

const registry: StyleRegistry = [
  [
    MenuBarStyles,
    {
      mode: 'append',
      styles: [style],
    },
  ],
  [
    MenuBarItemStyles,
    {
      mode: 'append',
      styles: [style],
    },
  ],
];

interface Props {
  context: IDataContext;
}

export const SqlExecutionPlanActionsMenu = observer<Props>(function SqlExecutionPlanActionsMenu({ context }) {
  const menuBarStyles = useS(style, MenuBarStyles, MenuBarItemStyles, MenuBarGroupStyles);
  const menu = useMenu({ menu: SQL_EXECUTION_PLAN_ACTIONS_MENU, context });

  if (!menu.items.length) {
    return null;
  }

  return (
    <SContext registry={registry}>
      <MenuBar
        menu={menu}
        className={s(menuBarStyles, { toolsMenu: true, floating: true, withLabel: true, executionPlanActions: true })}
        compact={false}
      />
    </SContext>
  );
});
