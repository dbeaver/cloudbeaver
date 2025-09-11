/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { preventFocusHandler, s, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useMenu } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA.js';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../DATA_CONTEXT_SQL_EDITOR_STATE.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import style from './SQLEditorActions.module.css';
import { SqlEditorActionsMenu } from './SqlEditorActionsMenu.js';
import { SqlEditorTools } from './SqlEditorTools.js';
import { SQL_EDITOR_ACTIONS_MENU } from './SQL_EDITOR_ACTIONS_MENU.js';

interface Props {
  data: ISQLEditorData;
  state: ISqlEditorTabState;
  className?: string;
}

export const SQLEditorActions = observer<Props>(function SQLEditorActions({ data, state, className }) {
  const styles = useS(style);
  const menu = useMenu({ menu: SQL_EDITOR_ACTIONS_MENU });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_SQL_EDITOR_STATE, state, id);
  });
  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_SQL_EDITOR_DATA, data, id);
  });

  return (
    <div className={s(styles, { container: true }, className)}>
      <div className={s(styles, { actions: true })} onMouseDown={preventFocusHandler}>
        <SqlEditorActionsMenu state={state} context={menu.context} />
      </div>
      <SqlEditorTools data={data} state={state} />
    </div>
  );
});
