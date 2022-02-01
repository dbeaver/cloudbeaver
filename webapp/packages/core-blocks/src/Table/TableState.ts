
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import { Executor, IExecutor } from '@cloudbeaver/core-executor';

type Key = string | string[];

interface IData {
  key: string;
  value: boolean;
}

export class TableState {
  readonly onExpand: IExecutor<IData>;

  selected: Map<string, boolean>;
  expanded: Map<string, boolean>;

  get itemsSelected(): boolean {
    return Array.from(this.selected.values()).some(v => v);
  }

  get selectedList(): string[] {
    return Array
      .from(this.selected)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  }

  get expandedList(): string[] {
    return Array
      .from(this.expanded)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  }

  constructor() {
    this.onExpand = new Executor();

    this.selected = new Map();
    this.expanded = new Map();

    makeObservable(this, {
      selected: observable,
      expanded: observable,
      itemsSelected: computed,
      selectedList: computed,
      expandedList: computed,
      unselect: action,
      unexpand: action,
    });
  }

  expand(key: string, value: boolean) {
    this.expanded.set(key, value);
    this.onExpand.execute({ key, value });
  }

  unselect(key?: Key): Map<string, boolean> {
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
  }

  unexpand(key?: Key): Map<string, boolean> {
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
  }

  reset() {
    this.unexpand();
    this.unselect();
  }
}
