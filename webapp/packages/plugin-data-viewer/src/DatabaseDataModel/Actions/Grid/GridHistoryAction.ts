/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { injectable } from '@cloudbeaver/core-di';
import { isNumber } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';

export interface IHistoryEntry<TData = unknown> {
  timestamp: number;
  data: TData;
  source: string;
}

export type CompressionMode = 'all' | 'lastSequence';
export type EntryComparator<TData> = (entry: IHistoryEntry<TData>, prevEntry: IHistoryEntry<TData> | null) => boolean;
export type CompressedEntryFactory<TData> = (entries: IHistoryEntry<TData>[]) => Omit<IHistoryEntry<TData>, 'timestamp'>;

const MAX_HISTORY_SIZE = 50;

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

    makeObservable<this, 'history' | 'currentIndex' | 'enforceHistoryLimit'>(this, {
      history: observable.shallow,
      currentIndex: observable,
      replaceLast: action,
      add: action,
      undo: action,
      redo: action,
      compress: action,
      enforceHistoryLimit: action,
    });
  }

  add(entry: Omit<IHistoryEntry<TData>, 'timestamp'>): void {
    const newEntry: IHistoryEntry<TData> = {
      ...entry,
      timestamp: Date.now(),
    };

    this.truncateFutureEntries();
    this.history.push(newEntry);
    this.enforceHistoryLimit();
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
    comparator: EntryComparator<TData>,
    createCompressedEntry: CompressedEntryFactory<TData>,
    mode: CompressionMode = 'all',
    compressedEntityIndex?: number,
  ): void {
    if (this.history.length === 0) {
      return;
    }

    const matchingIndices = this.findMatchingIndices(comparator, mode);

    if (matchingIndices.length <= 1) {
      return;
    }

    this.mergeEntries(matchingIndices, createCompressedEntry, compressedEntityIndex);
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

  private truncateFutureEntries(): void {
    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1);
    }
  }

  private enforceHistoryLimit(): void {
    if (this.history.length > MAX_HISTORY_SIZE) {
      const excess = this.history.length - MAX_HISTORY_SIZE;
      this.history.splice(0, excess);
    }
  }

  private findMatchingIndices(comparator: EntryComparator<TData>, mode: CompressionMode): number[] {
    const allMatching = this.history
      .map((entry, index) => {
        const prevEntry = this.history[index - 1] ?? null;
        return comparator(entry, prevEntry) ? index : undefined;
      })
      .filter(isNumber);

    if (mode === 'all') {
      return allMatching;
    }

    return allMatching.filter((currentIndex, i, arr) => {
      const prevIndex = arr[i - 1] ?? null;
      const nextIndex = arr[i + 1] ?? null;

      if (prevIndex !== null && currentIndex - prevIndex === 1) {
        return true;
      }
      if (nextIndex !== null && nextIndex - currentIndex === 1) {
        return true;
      }

      return false;
    });
  }

  private mergeEntries(matchingIndices: number[], createCompressedEntry: CompressedEntryFactory<TData>, compressedEntityIndex?: number): void {
    if (!matchingIndices.length) {
      return;
    }

    let targetIndex = compressedEntityIndex ?? matchingIndices[matchingIndices.length - 1]!;

    if (!matchingIndices.includes(targetIndex)) {
      console.warn('GridHistoryAction: Target index not in matching indices, using last match');
      targetIndex = matchingIndices[matchingIndices.length - 1]!;
    }

    const entriesToCompress = matchingIndices.map(index => this.history[index]).filter<IHistoryEntry<TData>>(isNotNullDefined);

    const removedBeforeTarget = matchingIndices.filter(index => index < targetIndex).length;
    const newTargetIndex = targetIndex - removedBeforeTarget;

    const compressedEntry: IHistoryEntry<TData> = {
      ...createCompressedEntry(entriesToCompress),
      timestamp: Date.now(),
    };

    matchingIndices
      .slice()
      .reverse()
      .forEach(index => {
        if (index !== targetIndex) {
          this.history.splice(index, 1);
        }
      });

    this.history[newTargetIndex] = compressedEntry;
    this.currentIndex = Math.min(this.currentIndex, newTargetIndex);
  }
}
