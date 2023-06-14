/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { MenuBar } from '@cloudbeaver/core-ui';
import { IDataContext, useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../DATA_CONTEXT_SQL_EDITOR_STATE';
import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SQL_EDITOR_ACTIONS_MENU } from './SQL_EDITOR_ACTIONS_MENU';
import { SQL_EDITOR_ACTIONS_MENU_STYLES } from './SQL_EDITOR_ACTIONS_MENU_STYLES';

interface Props {
  state: ISqlEditorTabState;
  context?: IDataContext;
  style?: ComponentStyle;
}

export const SqlEditorActionsMenu = observer<Props>(function SqlEditorActionsMenu({ state, context, style }) {
  const menu = useMenu({ menu: SQL_EDITOR_ACTIONS_MENU, context });
  menu.context.set(DATA_CONTEXT_SQL_EDITOR_STATE, state);

  return <MenuBar style={[SQL_EDITOR_ACTIONS_MENU_STYLES, ...[style].flat(2)]} menu={menu} />;
});
