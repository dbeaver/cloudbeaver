/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { useState } from 'react';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { INodeState } from './INodeState';
import type { TreeState } from './TreeState';

export interface ITreeState {
  getState(id: string): Readonly<INodeState>;
  updateState(id: string, state: Partial<INodeState>): void;
}

export function useTreeState(externalState?: TreeState): ITreeState {
  const [innerState] = useState(
    () =>
      new MetadataMap<string, INodeState>(() =>
        observable({
          expanded: false,
          selected: false,
          showInFilter: false,
        }),
      ),
  );

  const state = externalState ?? innerState;

  return useObservableRef(
    () => ({
      getState(id: string): Readonly<INodeState> {
        return state.get(id);
      },
      updateState(id: string, state: Partial<INodeState>): void {
        Object.assign(this.getState(id), state);
      },
    }),
    {
      state: observable.ref,
    },
    { state },
  );
}
