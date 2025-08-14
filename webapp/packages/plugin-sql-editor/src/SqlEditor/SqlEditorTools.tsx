/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { preventFocusHandler, s, useS } from '@cloudbeaver/core-blocks';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import style from './SqlEditorTools.module.css';
import { SqlEditorToolsMenu } from './SqlEditorToolsMenu.js';

interface Props {
  data: ISQLEditorData;
  state: ISqlEditorTabState;
  className?: string;
}

export const SqlEditorTools = observer<Props>(function SqlEditorTools({ data, state, className }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { tools: true }, className)} onMouseDown={preventFocusHandler}>
      <SqlEditorToolsMenu state={state} data={data} />
    </div>
  );
});
