import type { ICellPosition } from './ICellPosition.js';

// History entry types
export interface ITableEditorHistoryEntry<TValue> {
  readonly type: 'cell-edit' | 'row-insert' | 'row-delete';
  readonly timestamp: number;
  readonly data: ICellEditEntry<TValue> | IRowInsertEntry<TValue> | IRowDeleteEntry<TValue>;
}

export interface ICellEditEntry<TValue> {
  readonly position: ICellPosition;
  readonly oldValue: TValue;
  readonly newValue: TValue;
}

export interface IRowInsertEntry<TValue> {
  readonly rowIdx: number;
  readonly rowData: TValue[];
}

export interface IRowDeleteEntry<TValue> {
  readonly rowIdx: number;
  readonly rowData: TValue[];
}

// History management interface
export interface ITableEditorHistory<TValue> {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly size: number;
  readonly maxSize: number;

  push(entry: ITableEditorHistoryEntry<TValue>): void;
  undo(): ITableEditorHistoryEntry<TValue> | null;
  redo(): ITableEditorHistoryEntry<TValue> | null;
  clear(): void;
  setMaxSize(size: number): void;
}
