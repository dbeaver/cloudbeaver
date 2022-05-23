/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SplitProps, SplitterMode } from 'go-split';

import { useObjectRef } from '../useObjectRef';
import { useUserData } from '../useUserData';

type SplitState = Pick<SplitProps, 'mode' | 'size' | 'ratio' | 'onModeChange' | 'onResize'>;

export function useSplitUserState(id: string): SplitState {
  const state = useUserData<SplitState>(
    `splitter-state-${id}`,
    () => ({}),
    () => {},
  );

  return useObjectRef<SplitState & { state: SplitState }>(() => ({
    get mode(): SplitterMode | undefined {
      return this.state.mode;
    },
    get size(): number | undefined {
      return this.state.size;
    },
    get ratio(): number | undefined {
      return this.state.ratio;
    },
    onModeChange(mode) {
      this.state.mode = mode;
    },
    onResize(size, ratio) {
      this.state.ratio = ratio;
      this.state.size = size;
    },
  }), { state }, ['onModeChange', 'onResize']);
}