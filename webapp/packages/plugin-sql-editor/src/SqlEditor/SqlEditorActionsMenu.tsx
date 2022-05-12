/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../DATA_CONTEXT_SQL_EDITOR_STATE';
import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SQL_EDITOR_ACTIONS_MENU } from './SQL_EDITOR_ACTIONS_MENU';
import { SQL_EDITOR_ACTIONS_MENU_STYLES } from './SQL_EDITOR_ACTIONS_MENU_STYLES';

interface Props {
  state: ISqlEditorTabState;
  style?: ComponentStyle;
}

export const SqlEditorActionsMenu = observer<Props>(function SqlEditorActionsMenu({ state, style }) {
  const menu = useMenu({ menu: SQL_EDITOR_ACTIONS_MENU });
  menu.context.set(DATA_CONTEXT_SQL_EDITOR_STATE, state);

  return (
    <MenuBar style={[SQL_EDITOR_ACTIONS_MENU_STYLES, style]} menu={menu} />
  );
});