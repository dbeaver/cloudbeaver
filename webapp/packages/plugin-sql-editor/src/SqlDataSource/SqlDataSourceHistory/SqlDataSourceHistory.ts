/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeAutoObservable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { HistoryManager, type IHistoryState } from '@cloudbeaver/core-root';

import { createSqlDataSourceHistoryInitialState } from './createSqlDataSourceHistoryInitialState.js';
import type { ISqlDataSourceHistory } from './ISqlDataSourceHistory.js';
import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState.js';
import type { ISqlDataSourceHistoryData } from './ISqlDataSourceHistoryData.js';
import type { ISqlEditorCursor } from '../ISqlDataSource.js';

export class SqlDataSourceHistory implements ISqlDataSourceHistory {
  state: ISqlDataSourceHistoryState;
  readonly onNavigate: ISyncExecutor<{
    value: string;
    cursor?: ISqlEditorCursor;
  }>;
  private readonly historyManager: HistoryManager<ISqlDataSourceHistoryData>;

  constructor() {
    const initialState = createSqlDataSourceHistoryInitialState();
    this.state = initialState;
    this.onNavigate = new SyncExecutor();
    this.historyManager = new HistoryManager<ISqlDataSourceHistoryData>(initialState.history[0]!, {
      isEqual: (a, b) => a.value === b.value,
    });

    makeAutoObservable(this, {
      onNavigate: false,
    });
  }

  add(value: string, source?: string, cursor?: ISqlEditorCursor): void {
    const historyItem: ISqlDataSourceHistoryData = {
      value,
      source,
      timestamp: Date.now(),
      cursor,
    };
    this.historyManager.add(historyItem, source);
    this.syncStateFromManager();
  }

  undo(): void {
    const value = this.historyManager.undo();
    if (value !== null) {
      this.syncStateFromManager();
      this.onNavigate.execute(value);
    }
  }

  redo(): void {
    const value = this.historyManager.redo();
    if (value !== null) {
      this.syncStateFromManager();
      this.onNavigate.execute(value);
    }
  }

  restore(state: ISqlDataSourceHistoryState): void {
    this.state = state;
    this.historyManager.restore(mapStateToHistoryManagerState(state));
  }

  clear(): void {
    const initialState = createSqlDataSourceHistoryInitialState();
    this.state = initialState;
    this.historyManager.clear(initialState.history[0]!);
  }

  private syncStateFromManager(): void {
    const managerState = this.historyManager.getState();
    this.state = {
      history: managerState.history.map(item => item.value),
      historyIndex: managerState.historyIndex,
    };
  }
}

function mapStateToHistoryManagerState(state: ISqlDataSourceHistoryState): IHistoryState<ISqlDataSourceHistoryData> {
  return {
    history: state.history.map(item => ({
      value: item,
      timestamp: item.timestamp,
      source: item.source,
      metadata: {},
    })),
    historyIndex: state.historyIndex,
  };
}
