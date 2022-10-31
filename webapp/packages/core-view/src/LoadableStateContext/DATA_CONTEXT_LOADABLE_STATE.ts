/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { flat, ILoadableState } from '@cloudbeaver/core-utils';

import { createDataContext } from '../DataContext/createDataContext';

interface ILoadableStateContext {
  getState(id: string, defaultState: () => ILoadableState | ILoadableState[]): ILoadableState[];
}

export function loadableStateContext(): ILoadableStateContext {
  const state = new Map<string, ILoadableState[]>();

  return {
    getState(id, defaultState) {
      if (!state.has(id)) {
        state.set(id, flat([defaultState()]));
      }

      return state.get(id)!;
    },
  };
}

export const DATA_CONTEXT_LOADABLE_STATE = createDataContext<ILoadableStateContext>('loadable-state', loadableStateContext);
