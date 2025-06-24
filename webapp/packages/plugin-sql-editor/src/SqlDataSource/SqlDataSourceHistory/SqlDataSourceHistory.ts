/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeAutoObservable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import { createSqlDataSourceHistoryInitialState } from './createSqlDataSourceHistoryInitialState.js';
import type { ISqlDataSourceHistory } from './ISqlDataSourceHistory.js';
import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState.js';
import type { ISqlEditorCursor } from '../ISqlDataSource.js';

const HOT_HISTORY_SIZE = 30;
const COMPRESSED_HISTORY_DELAY = 5000;

export class SqlDataSourceHistory implements ISqlDataSourceHistory {
  state: ISqlDataSourceHistoryState;
  readonly onNavigate: ISyncExecutor<{
    value: string;
    cursor?: ISqlEditorCursor;
  }>;

  constructor() {
    this.state = createSqlDataSourceHistoryInitialState();
    this.onNavigate = new SyncExecutor();

    makeAutoObservable(this, {
      onNavigate: false,
    });
  }

  add(value: string, source?: string, cursor?: ISqlEditorCursor): void {
    // skip history if value is the same as current
    if (this.state.history[this.state.historyIndex]!.value === value) {
      return;
    }

    // remove all history after current index
    if (this.state.historyIndex + 1 < this.state.history.length) {
      this.state.history.splice(this.state.historyIndex + 1);
    }

    this.state.historyIndex = this.state.history.push({ value, source, timestamp: Date.now(), cursor }) - 1;
    this.compressHistory();
  }

  undo(): void {
    if (this.state.historyIndex === 0) {
      return;
    }
    this.state.historyIndex--;
    const prevHistoryItem = this.state.history[this.state.historyIndex]!;
    this.onNavigate.execute(prevHistoryItem);
  }

  redo(): void {
    if (this.state.historyIndex + 1 >= this.state.history.length) {
      return;
    }

    this.state.historyIndex++;
    const prevHistoryItem = this.state.history[this.state.historyIndex]!;
    this.onNavigate.execute(prevHistoryItem);
  }

  restore(state: ISqlDataSourceHistoryState): void {
    this.state = state;
  }

  clear(): void {
    this.state = createSqlDataSourceHistoryInitialState();
  }

  private compressHistory(): void {
    if (this.state.history.length > HOT_HISTORY_SIZE) {
      for (let i = this.state.history.length - HOT_HISTORY_SIZE; i > 1; i--) {
        const prevEntity = this.state.history[i - 1]!;
        const entity = this.state.history[i]!;

        if (prevEntity.timestamp === -1) {
          break;
        }

        if (entity.timestamp - prevEntity.timestamp < COMPRESSED_HISTORY_DELAY) {
          this.state.history.splice(i, 1);
        } else {
          prevEntity.timestamp = -1;
        }
      }

      this.state.historyIndex = this.state.history.length - 1;
    }
  }
}
