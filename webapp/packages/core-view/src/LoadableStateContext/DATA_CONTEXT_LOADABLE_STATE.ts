/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { createDataContext } from '@cloudbeaver/core-data-context';
import { flat, type ILoadableState } from '@cloudbeaver/core-utils';

interface ILoadableStateContext {
  readonly loaders: ILoadableState[];
  getState(id: string, defaultState: () => ILoadableState | ILoadableState[]): ILoadableState[];
  removeState(id: string): void;
}

export function loadableStateContext(): ILoadableStateContext {
  const state = observable(new Map<string, ILoadableState[]>(), { deep: false });

  return {
    get loaders(): ILoadableState[] {
      return flat([...state.values()]);
    },
    getState(id, defaultState) {
      if (!state.has(id)) {
        state.set(id, flat([defaultState()]));
      }

      return state.get(id)!;
    },
    removeState(id) {
      state.delete(id);
    },
  };
}

export const DATA_CONTEXT_LOADABLE_STATE = createDataContext<ILoadableStateContext>('loadable-state');
