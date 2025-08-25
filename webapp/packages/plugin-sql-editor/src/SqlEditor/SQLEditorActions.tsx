/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { preventFocusHandler, s, useS } from '@cloudbeaver/core-blocks';
import { useDataContext } from '@cloudbeaver/core-data-context';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA.js';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../DATA_CONTEXT_SQL_EDITOR_STATE.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import style from './SQLEditorActions.module.css';
import { SqlEditorActionsMenu } from './SqlEditorActionsMenu.js';
import { SqlEditorTools } from './SqlEditorTools.js';

interface Props {
  data: ISQLEditorData;
  state: ISqlEditorTabState;
  className?: string;
}

export const SQLEditorActions = observer<Props>(function SQLEditorActions({ data, state, className }) {
  const styles = useS(style);

  const menuContext = useDataContext();
  menuContext.set(DATA_CONTEXT_SQL_EDITOR_DATA, data, 'sql-editor-data');
  menuContext.set(DATA_CONTEXT_SQL_EDITOR_STATE, state, 'sql-editor-state');

  return (
    <div className={s(styles, { container: true }, className)}>
      <div className={s(styles, { actions: true })} onMouseDown={preventFocusHandler}>
        <SqlEditorActionsMenu state={state} context={menuContext} />
      </div>
      <SqlEditorTools data={data} state={state} />
    </div>
  );
});
