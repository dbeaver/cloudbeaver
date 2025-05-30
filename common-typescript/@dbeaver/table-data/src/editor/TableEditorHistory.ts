import type { ITableEditorHistory, ITableEditorHistoryEntry } from './ITableEditorHistory.js';

/**
 * Implementation of table editor history with undo/redo functionality.
 * Maintains a circular buffer of history entries with a configurable maximum size.
 */
export class TableEditorHistory<TValue> implements ITableEditorHistory<TValue> {
  private entries: ITableEditorHistoryEntry<TValue>[] = [];
  private currentIndex: number = -1;
  private _maxSize: number;

  constructor(maxSize: number = 100) {
    this._maxSize = Math.max(1, maxSize);
  }

  get canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  get canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  get size(): number {
    return this.entries.length;
  }

  get maxSize(): number {
    return this._maxSize;
  }

  push(entry: ITableEditorHistoryEntry<TValue>): void {
    // Remove any entries after the current index (when pushing after undo)
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    // Add the new entry
    this.entries.push(entry);
    this.currentIndex = this.entries.length - 1;

    // Maintain max size by removing oldest entries
    if (this.entries.length > this._maxSize) {
      const removeCount = this.entries.length - this._maxSize;
      this.entries = this.entries.slice(removeCount);
      this.currentIndex -= removeCount;
    }
  }

  undo(): ITableEditorHistoryEntry<TValue> | null {
    if (!this.canUndo) {
      return null;
    }

    const entry = this.entries[this.currentIndex];
    this.currentIndex--;
    return entry ?? null;
  }

  redo(): ITableEditorHistoryEntry<TValue> | null {
    if (!this.canRedo) {
      return null;
    }

    this.currentIndex++;
    const entry = this.entries[this.currentIndex];
    return entry ?? null;
  }

  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }

  setMaxSize(size: number): void {
    this._maxSize = Math.max(1, size);
    
    // Trim entries if the new max size is smaller
    if (this.entries.length > this._maxSize) {
      const removeCount = this.entries.length - this._maxSize;
      this.entries = this.entries.slice(removeCount);
      this.currentIndex = Math.max(-1, this.currentIndex - removeCount);
    }
  }
}
