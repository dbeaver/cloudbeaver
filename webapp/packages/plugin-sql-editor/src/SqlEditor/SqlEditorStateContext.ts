/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISQLEditorData } from './ISQLEditorData.js';

interface ISqlEditorStateContext {
  state: ISQLEditorData | null;
  setState: (state: ISQLEditorData | null) => void;
}

export function SqlEditorStateContext(): ISqlEditorStateContext {
  return {
    state: null,
    setState(state) {
      this.state = state;
    },
  };
}
