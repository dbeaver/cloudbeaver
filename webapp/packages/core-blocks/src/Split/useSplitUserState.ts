/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SplitProps, SplitterMode } from 'go-split';
import { action, computed, observable, runInAction } from 'mobx';

import { useObservableRef } from '../useObservableRef';
import { useUserData } from '../useUserData';

type SplitState = Pick<SplitProps, 'mode' | 'size' | 'ratio' | 'onModeChange' | 'onResize'>;

export function useSplitUserState(id: string): SplitState {
  const state = useUserData<SplitState>(
    `splitter-state-${id}`,
    () => ({}),
    () => {},
  );

  return useObservableRef<SplitState & { state: SplitState }>(() => ({
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
      state.mode = mode;
    },
    onResize(size, ratio) {
      runInAction(() => {
        state.ratio = ratio;
        state.size = size;
      });
    },
  }), {
    mode: computed,
    size: computed,
    ratio: computed,
    onModeChange: action,
    onResize: action,
    state: observable.ref,
  }, { state });
}