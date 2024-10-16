/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { SplitProps, SplitterMode } from 'go-split';

import { useObjectRef } from '../useObjectRef.js';
import { useUserData } from '../useUserData.js';

type SplitState = Pick<SplitProps, 'mode' | 'size' | 'ratio' | 'disable' | 'onModeChange' | 'onResize' | 'onDisable'>;

export function useSplitUserState(id: string): SplitState {
  const state = useUserData<SplitState>(
    `splitter-state-${id}`,
    () => ({}),
    () => {},
  );

  return useObjectRef<SplitState & { state: SplitState }>(
    () => ({
      get mode(): SplitterMode | undefined {
        return this.state.mode;
      },
      get size(): number | undefined {
        return this.state.size;
      },
      get ratio(): number | undefined {
        return this.state.ratio;
      },
      get disable(): boolean | undefined {
        return this.state.disable;
      },
      onModeChange(mode) {
        this.state.mode = mode;
      },
      onResize(size, ratio) {
        this.state.ratio = ratio;
        this.state.size = size;
      },
      onDisable(disable) {
        this.state.disable = disable ? true : undefined;
      },
    }),
    { state },
    ['onModeChange', 'onResize', 'onDisable'],
  );
}
