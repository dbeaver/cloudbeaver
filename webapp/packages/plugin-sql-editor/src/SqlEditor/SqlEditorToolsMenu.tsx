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

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../DATA_CONTEXT_SQL_EDITOR_STATE';
import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA';
import type { ISQLEditorData } from './ISQLEditorData';
import { SQL_EDITOR_TOOLS_MENU } from './SQL_EDITOR_TOOLS_MENU';
import SqlEditorActionsMenuBarStyles from './SqlEditorActionsMenuBar.m.css';
import SqlEditorActionsMenuBarItemStyles from './SqlEditorActionsMenuBarItem.m.css';

interface Props {
  data: ISQLEditorData;
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
export const SqlEditorToolsMenu = observer<Props>(function SqlEditorToolsMenu({ data, state, context, className }) {
  const menuBarStyles = useS(SqlEditorActionsMenuBarStyles, SqlEditorActionsMenuBarItemStyles, MenuBarStyles, MenuBarItemStyles);
  const menu = useMenu({ menu: SQL_EDITOR_TOOLS_MENU, context });
  menu.context.set(DATA_CONTEXT_SQL_EDITOR_STATE, state);
  context?.set(DATA_CONTEXT_SQL_EDITOR_DATA, data);

  return (
    <SContext registry={registry}>
      <MenuBar menu={menu} className={s(menuBarStyles, { sqlActions: true, floating: true }, className)} />
    </SContext>
  );
});
