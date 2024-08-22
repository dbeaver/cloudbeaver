/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import type { EditorState } from '@cloudbeaver/plugin-codemirror6';

import classes from './SqlEditorInfoBar.module.css';

interface Props {
  state: EditorState;
}

export const SqlEditorInfoBar = observer<Props>(function SqlEditorInfoBar({ state }) {
  const styles = useS(classes);

  const cursorPos = state.selection.main.head;
  const line = state.doc.lineAt(cursorPos);
  // We need to add 1 to the cursor index because the cursor is zero-based
  const cursorIndexInRow = cursorPos - line.from + 1;

  return (
    <div className={s(styles, { container: true })}>
      <div className={s(styles, { info: true })}>{`Ln ${line.number}, Col ${cursorIndexInRow}, Pos ${cursorPos}`}</div>
    </div>
  );
});
