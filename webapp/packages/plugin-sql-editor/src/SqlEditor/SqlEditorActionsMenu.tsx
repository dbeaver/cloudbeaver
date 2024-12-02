/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { SQL_EDITOR_ACTIONS_MENU } from './SQL_EDITOR_ACTIONS_MENU.js';
import SqlEditorActionsMenuBarStyles from './SqlEditorActionsMenuBar.module.css';
import SqlEditorActionsMenuBarItemStyles from './SqlEditorActionsMenuBarItem.module.css';

interface Props {
  state: ISqlEditorTabState;
  context?: IDataContext;
  className?: string;
}

const registry: StyleRegistry = [
  [
    MenuBarStyles,
    {
      mode: 'append',
      styles: [SqlEditorActionsMenuBarStyles],
    },
  ],
  [
    MenuBarItemStyles,
    {
      mode: 'append',
      styles: [SqlEditorActionsMenuBarItemStyles],
    },
  ],
];

export const SqlEditorActionsMenu = observer<Props>(function SqlEditorActionsMenu({ state, context, className }) {
  const menuBarStyles = useS(SqlEditorActionsMenuBarStyles, SqlEditorActionsMenuBarItemStyles, MenuBarStyles, MenuBarItemStyles);
  const menu = useMenu({ menu: SQL_EDITOR_ACTIONS_MENU, context });

  return (
    <SContext registry={registry}>
      <MenuBar menu={menu} className={s(menuBarStyles, { toolsMenu: true, floating: true, sqlActions: true }, className)} />
    </SContext>
  );
});
