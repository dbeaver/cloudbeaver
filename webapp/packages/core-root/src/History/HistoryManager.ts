/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isObjectsEqual } from '@cloudbeaver/core-utils';

export interface IHistoryItem<T> {
  value: T;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface IHistoryState<T> {
  history: IHistoryItem<T>[];
  historyIndex: number;
}

export interface IHistoryManagerOptions<T> {
  hotHistorySize?: number;
  compressedHistoryDelay?: number;
  isEqual?: (valueA: T, valueB: T) => boolean;
}

const DEFAULT_HOT_HISTORY_SIZE = 30;
const DEFAULT_COMPRESSED_HISTORY_DELAY = 5000;

export class HistoryManager<T> {
  private state: IHistoryState<T>;
  private readonly hotHistorySize: number;
  private readonly compressedHistoryDelay: number;
  private readonly isEqualFn: (valueA: T, valueB: T) => boolean;

  constructor(initialValue: T, options: IHistoryManagerOptions<T> = {}) {
    this.hotHistorySize = options.hotHistorySize ?? DEFAULT_HOT_HISTORY_SIZE;
    this.compressedHistoryDelay = options.compressedHistoryDelay ?? DEFAULT_COMPRESSED_HISTORY_DELAY;
    this.isEqualFn = options.isEqual ?? isObjectsEqual;
    this.state = {
      history: [{ value: initialValue, timestamp: Date.now() }],
      historyIndex: 0,
    };
  }

  getState(): IHistoryState<T> {
    return this.state;
  }

  getCurrentValue(): T {
    return this.state.history[this.state.historyIndex]!.value;
  }

  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.state.historyIndex + 1 < this.state.history.length;
  }

  add(value: T, source?: string, metadata?: Record<string, unknown>): void {
    // skip history if value is the same as current
    if (this.isEqualFn(this.state.history[this.state.historyIndex]!.value, value)) {
      return;
    }

    // remove all history after current index
    if (this.state.historyIndex + 1 < this.state.history.length) {
      this.state.history.splice(this.state.historyIndex + 1);
    }

    this.state.historyIndex =
      this.state.history.push({
        value,
        source,
        timestamp: Date.now(),
        metadata,
      }) - 1;
    this.compressHistory();
  }

  undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }
    this.state.historyIndex--;
    return this.state.history[this.state.historyIndex]!.value;
  }

  redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }
    this.state.historyIndex++;
    return this.state.history[this.state.historyIndex]!.value;
  }

  restore(state: IHistoryState<T>): void {
    this.state = state;
  }

  clear(initialValue: T): void {
    this.state = {
      history: [{ value: initialValue, timestamp: Date.now() }],
      historyIndex: 0,
    };
  }

  private compressHistory(): void {
    if (this.state.history.length > this.hotHistorySize) {
      for (let i = this.state.history.length - this.hotHistorySize; i > 1; i--) {
        const prevEntity = this.state.history[i - 1]!;
        const entity = this.state.history[i]!;

        if (prevEntity.timestamp === -1) {
          break;
        }

        if (entity.timestamp - prevEntity.timestamp < this.compressedHistoryDelay) {
          this.state.history.splice(i, 1);
        } else {
          prevEntity.timestamp = -1;
        }
      }

      this.state.historyIndex = this.state.history.length - 1;
    }
  }
}
