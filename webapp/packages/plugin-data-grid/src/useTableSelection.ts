/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import type { ITableSelection } from './TableSelectionContext.js';

export function useTableSelection(keys: string[]): ITableSelection {
  const selection: ITableSelection = useObservableRef(
    () => ({
      get list() {
        return Array.from(this.state);
      },
      get selected() {
        return this.list.filter(item => this.keys.includes(item));
      },
      state: new Set(),
      select(id: string) {
        if (this.state.has(id)) {
          this.state.delete(id);
        } else {
          this.state.add(id);
        }
      },
      selectRoot() {
        const isAll = this.keys.length === this.selected.length;

        for (const key of this.keys) {
          if (isAll) {
            this.state.delete(key);
            continue;
          }

          this.state.add(key);
        }
      },
      clear() {
        this.state.clear();
      },
    }),
    {
      list: computed,
      selected: computed,
      state: observable,
      keys: observable.ref,
      select: action.bound,
      selectRoot: action.bound,
      clear: action.bound,
    },
    { keys },
  );

  return selection;
}
