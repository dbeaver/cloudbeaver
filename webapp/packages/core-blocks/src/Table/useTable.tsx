
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

type Key = string | string[];

export interface ITableState {
  selected: Map<string, boolean>;
  expanded: Map<string, boolean>;
  readonly itemsSelected: boolean;
  readonly selectedList: string[];
  unselect: (key?: Key) => Map<string, boolean>;
  unexpand: (key?: Key) => Map<string, boolean>;
}

export function useTable(): ITableState {
  return useObservableRef<ITableState>(() => ({
    selected: new Map(),
    expanded: new Map(),
    get selectedList() {
      return Array
        .from(this.selected)
        .filter(([_, value]) => value)
        .map(([key]) => key);
    },
    get itemsSelected() {
      return Array.from(this.selected.values()).some(v => v);
    },
    unselect(key?: string | string[]) {
      if (key === undefined) {
        this.selected.clear();
      } else {
        if (typeof key === 'string') {
          this.selected.delete(key);
        } else {
          for (const id of key) {
            this.selected.delete(id);
          }
        }
      }

      return this.selected;
    },
    unexpand(key?: string | string[]) {
      if (key === undefined) {
        this.expanded.clear();
      } else {
        if (typeof key === 'string') {
          this.expanded.delete(key);
        } else {
          for (const id of key) {
            this.expanded.delete(id);
          }
        }
      }

      return this.expanded;
    },
  }), {
    selected: observable,
    expanded: observable,
    selectedList: computed,
    itemsSelected: computed,
    unexpand: action.bound,
    unselect: action.bound,
  }, false);
}
