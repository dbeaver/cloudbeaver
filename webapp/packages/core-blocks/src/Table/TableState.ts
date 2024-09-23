/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

interface IData<Key> {
  key: Key;
  value: boolean;
}

export class TableState<K = string> {
  readonly onExpand: IExecutor<IData<K>>;

  selected: Map<K, boolean>;
  expanded: Map<K, boolean>;

  get itemsSelected(): boolean {
    return Array.from(this.selected.values()).some(v => v);
  }

  get selectedList(): K[] {
    return Array.from(this.selected)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  }

  get expandedList(): K[] {
    return Array.from(this.expanded)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  }

  constructor() {
    this.onExpand = new Executor();

    this.selected = new Map<K, boolean>();
    this.expanded = new Map<K, boolean>();

    makeObservable(this, {
      selected: observable,
      expanded: observable,
      itemsSelected: computed,
      selectedList: computed,
      expandedList: computed,
      unselect: action,
      collapse: action,
    });
  }

  unselect(key?: K | K[]): Map<K, boolean> {
    if (key === undefined) {
      this.selected.clear();
    } else {
      const keys = Array.isArray(key) ? key : [key];

      for (const id of keys) {
        this.selected.delete(id);
      }
    }

    return this.selected;
  }

  expand(key: K, value: boolean) {
    this.expanded.set(key, value);
    this.onExpand.execute({ key, value });
  }

  collapse(key?: K | K[]): Map<K, boolean> {
    if (key === undefined) {
      this.expanded.clear();
    } else {
      const keys = Array.isArray(key) ? key : [key];

      for (const id of keys) {
        this.expanded.delete(id);
      }
    }

    return this.expanded;
  }

  reset() {
    this.collapse();
    this.unselect();
  }
}
