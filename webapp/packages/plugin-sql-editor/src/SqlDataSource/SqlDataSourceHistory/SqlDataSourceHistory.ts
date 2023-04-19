/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeAutoObservable } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import { createSqlDataSourceHistoryInitialState } from './createSqlDataSourceHistoryInitialState';
import type { ISqlDataSourceHistory } from './ISqlDataSourceHistory';
import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState';

const HISTORY_DELAY = 1000;

export class SqlDataSourceHistory implements ISqlDataSourceHistory {
  state: ISqlDataSourceHistoryState;
  readonly onNavigate: ISyncExecutor<string>;
  private lastAddTime = 0;

  constructor() {
    this.state = createSqlDataSourceHistoryInitialState();
    this.onNavigate = new SyncExecutor();

    makeAutoObservable(this, {
      onNavigate: false,
    });
  }

  add(value: string, source?: string): void {
    // skip history if value is the same as current
    if (this.state.history[this.state.historyIndex].value === value) {
      return;
    }

    // remove all history after current index
    if (this.state.historyIndex + 1 < this.state.history.length) {
      this.state.history.splice(this.state.historyIndex + 1);
      this.lastAddTime = 0;
    }

    if (this.lastAddTime + HISTORY_DELAY < Date.now()) {
      this.state.history.push({ value, source });
      this.state.historyIndex = this.state.history.length - 1;
      this.lastAddTime = Date.now();
    } else {
      // update last history item
      this.state.history[this.state.history.length - 1] = { value, source };
    }
  }

  undo(): void {
    if (this.state.historyIndex === 0) {
      return;
    }
    this.state.historyIndex--;
    const value = this.state.history[this.state.historyIndex].value;
    this.onNavigate.execute(value);
  }

  redo(): void {
    if (this.state.historyIndex + 1 >= this.state.history.length) {
      return;
    }

    this.state.historyIndex++;
    const value = this.state.history[this.state.historyIndex].value;
    this.onNavigate.execute(value);
  }

  restore(state: ISqlDataSourceHistoryState): void {
    this.state = state;
  }

  clear(): void {
    this.state = createSqlDataSourceHistoryInitialState();
  }
}