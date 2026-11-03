/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';

import styles from './InlineEditor.module.css';

export const EditorAction = observer<React.ButtonHTMLAttributes<HTMLButtonElement>>(function EditorAction({ children, ...props }) {
  const style = useS(styles);

  return (
    <button className={s(style, { editorAction: true })} {...props}>
      {children}
    </button>
  );
});
