/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { injectable } from '@cloudbeaver/core-di';
import { isNumber } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

export interface IHistoryEntry<TData = unknown> {
  timestamp: number;
  data: TData;
  source: string;
}

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult])
export class GridHistoryAction<TData = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult> extends DatabaseDataAction<any, TResult> {
  readonly onAdd: ISyncExecutor<IHistoryEntry<TData>>;
  readonly onUndo: ISyncExecutor<IHistoryEntry<TData>>;
  readonly onRedo: ISyncExecutor<IHistoryEntry<TData>>;

  private readonly history: IHistoryEntry<TData>[];
  private currentIndex: number;

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.onAdd = new SyncExecutor();
    this.onUndo = new SyncExecutor();
    this.onRedo = new SyncExecutor();
    this.history = [];
    this.currentIndex = -1;

    makeObservable<this, 'history' | 'currentIndex'>(this, {
      history: observable.shallow,
      currentIndex: observable,
      replaceLast: action,
      add: action,
      undo: action,
      redo: action,
      compress: action,
    });
  }

  add(entry: Omit<IHistoryEntry<TData>, 'id' | 'timestamp'>): void {
    const newEntry: IHistoryEntry<TData> = {
      ...entry,
      timestamp: Date.now(),
    };

    // remove all entries after the current index (if any)
    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1);
    }

    this.history.push(newEntry);
    this.currentIndex = this.history.length - 1;

    this.onAdd.execute(newEntry);
  }

  get(index: number): IHistoryEntry<TData> | undefined {
    return this.history[index];
  }

  replaceLast(entry: IHistoryEntry<TData>): void {
    this.history[this.history.length - 1] = entry;
  }

  compress(
    comparator: (entry: IHistoryEntry<TData>, prevEntry: IHistoryEntry<TData> | null) => boolean,
    createCompressedEntry: (entries: IHistoryEntry<TData>[]) => Omit<IHistoryEntry<TData>, 'timestamp'>,
    mode: 'all' | 'lastSequence' = 'all',
    compressedEntityIndex?: number,
  ): void {
    if (this.history.length === 0) {
      return;
    }

    const allMatchingIndices: number[] = this.history.map((entry, index) => {
      const prevEntry = this.history[index - 1] ?? null;

      if (entry && comparator(entry, prevEntry)) {
        return index;
      }
      return undefined;
    }).filter(isNumber).filter((currentIndex, i, arr) => {
      const prevIndex = arr[i - 1] ?? null;
      const nextIndex = arr[i + 1] ?? null;

      if (mode === 'lastSequence') {
        if (prevIndex) {
          return currentIndex - prevIndex === 1;
        } else if (nextIndex) {
          return nextIndex - currentIndex === 1;
        }

        return false;
      }

      return true;
    });

    if (allMatchingIndices.length <= 1) {
      return;
    }

    const targetIndex = compressedEntityIndex ?? allMatchingIndices[allMatchingIndices.length - 1]!;
    const entriesToCompress = allMatchingIndices
      .map(index => this.history[index])
      .filter<IHistoryEntry<TData>>(isNotNullDefined);
    const removedBeforeTarget = allMatchingIndices.filter(index => index < targetIndex).length;
    const newTargetIndex = targetIndex - removedBeforeTarget;
    const compressedEntry: IHistoryEntry<TData> = {
      ...createCompressedEntry(entriesToCompress),
      timestamp: Date.now(),
    };

    allMatchingIndices.reverse().forEach(index => {
      if (index !== targetIndex) {
        this.history.splice(index, 1);
      }
    });

    this.history[newTargetIndex] = compressedEntry;
    this.currentIndex = Math.min(this.currentIndex, newTargetIndex);
  }

  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const entry = this.getCurrentEntry();
    this.currentIndex--;
    if (entry) {
      this.onUndo.execute(entry);
    }
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const entry = this.getCurrentEntry();
    if (entry) {
      this.onRedo.execute(entry);
    }
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentEntry(): IHistoryEntry<TData> | undefined {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return undefined;
    }
    return this.history[this.currentIndex];
  }

  getState(): readonly IHistoryEntry<TData>[] {
    return this.history;
  }

  clear(): void {
    this.history.length = 0;
    this.currentIndex = -1;
  }
}
