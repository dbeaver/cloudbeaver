/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../DATA_CONTEXT_SQL_EDITOR_STATE';
import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SQL_EDITOR_TOOLS_MENU } from './SQL_EDITOR_TOOLS_MENU';
import SqlEditorActionsMenuBarStyles from './SqlEditorActionsMenuBar.m.css';
import SqlEditorActionsMenuBarItemStyles from './SqlEditorActionsMenuBarItem.m.css';

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
export const SqlEditorToolsMenu = observer<Props>(function SqlEditorToolsMenu({ state, context, className }) {
  const styles = useS(SqlEditorActionsMenuBarStyles, SqlEditorActionsMenuBarItemStyles);
  const menu = useMenu({ menu: SQL_EDITOR_TOOLS_MENU, context });
  menu.context.set(DATA_CONTEXT_SQL_EDITOR_STATE, state);

  return (
    <SContext registry={registry}>
      <MenuBar menu={menu} className={s(styles, { sqlActions: true }, className)} />
    </SContext>
  );
});
