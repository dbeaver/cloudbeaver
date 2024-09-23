/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ISplitState, SplitContext, type SplitterMode } from 'go-split';
import { useContext } from 'react';

import { useObjectRef } from '../useObjectRef.js';

interface ISplit {
  state: ISplitState;
  fixate(mode: SplitterMode, state: boolean): void;
}

export function useSplit(): ISplit {
  return useObjectRef<ISplit>(
    () => ({
      fixate(mode, state) {
        if (state) {
          if (this.state.mode !== mode || !this.state.disable) {
            this.state.setDisable(true);
            this.state.setMode(mode);
          }
        } else if (this.state.disable) {
          this.state.setDisable(false);
        }
      },
    }),
    {
      state: useContext(SplitContext),
    },
    ['fixate'],
  );
}
