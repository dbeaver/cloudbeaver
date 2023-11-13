/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';
import type { EditorState } from '@cloudbeaver/plugin-codemirror6';
import type { ISqlDataSource } from '@cloudbeaver/plugin-sql-editor';

import classes from './SqlEditorStatusBar.m.css';

interface Props {
  state: EditorState | null;
  dataSource: ISqlDataSource | undefined;
}

export const SqlEditorStatusBar = observer<Props>(function SqlEditorStatusBar({ state, dataSource }) {
  const styles = useS(classes);

  return (
    <div className={s(styles, { container: true })}>
      <Loader className={s(styles, { loader: true })} message={dataSource?.message} state={dataSource} inline inlineException />
      {state && <code className={s(styles, { metadata: true })}>{getMetadata(state)}</code>}
    </div>
  );
});

function getMetadata(state: EditorState) {
  const cursorPos = state.selection.main.head;
  const line = state.doc.lineAt(cursorPos);
  // We need to add 1 to the cursor index because the cursor is zero-based
  const cursorIndexInRow = cursorPos - line.from + 1;

  return `${line.number}:${cursorIndexInRow}:${cursorPos}`;
}
