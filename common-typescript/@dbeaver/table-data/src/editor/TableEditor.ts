import { createNanoEvents, type Emitter, type Unsubscribe } from 'nanoevents';
import type { ITableEditor } from './ITableEditor.js';
import type { ICellPosition } from './ICellPosition.js';
import type { ITableEditorHistory, ITableEditorHistoryEntry } from './ITableEditorHistory.js';
import type { TableEditorEvents } from './TableEditorEvents.js';
import { TableEditorHistory } from './TableEditorHistory.js';

export class TableEditor<TValue> implements ITableEditor<TValue> {
  private readonly _data: TValue[][];
  private readonly _history: ITableEditorHistory<TValue>;
  private readonly _emitter: Emitter<TableEditorEvents<TValue>>;
  private _isEdited = false;

  constructor(initialData: TValue[][] = [], historyMaxSize = 100) {
    this._data = initialData.map(row => [...row]);
    this._history = new TableEditorHistory<TValue>(historyMaxSize);
    this._emitter = createNanoEvents();
  }

  get data(): readonly (readonly TValue[])[] {
    return this._data.map(row => Object.freeze([...row]));
  }

  get isEdited(): boolean {
    return this._isEdited;
  }

  get rowCount(): number {
    return this._data.length;
  }

  get history(): ITableEditorHistory<TValue> {
    return this._history;
  }

  getCellValue(position: ICellPosition): TValue | undefined {
    if (!this.isValidPosition(position)) {
      return undefined;
    }
    return this._data[position.rowIdx]?.[position.colIdx];
  }

  setCellValue(position: ICellPosition, value: TValue): void {
    if (!this.isValidPosition(position)) {
      throw new Error(`Invalid cell position: row ${position.rowIdx}, column ${position.colIdx}`);
    }

    const row = this._data[position.rowIdx];
    if (!row) {
      throw new Error(`Row ${position.rowIdx} does not exist`);
    }

    const oldValue = row[position.colIdx];
    
    if (oldValue === value) {
      return;
    }

    const historyEntry: ITableEditorHistoryEntry<TValue> = {
      type: 'cell-edit',
      timestamp: Date.now(),
      data: {
        position: { ...position },
        oldValue: oldValue as TValue,
        newValue: value,
      },
    };
    this._history.push(historyEntry);

    row[position.colIdx] = value;

    this._isEdited = true;

    this.emit('data-changed');
    this.emitHistoryChanged();
  }

  insertRow(rowIdx: number, rowData?: TValue[]): void {
    if (rowIdx < 0 || rowIdx > this._data.length) {
      throw new Error(`Invalid row index: ${rowIdx}. Must be between 0 and ${this._data.length}`);
    }

    const newRowData = rowData ? [...rowData] : [];
    
    if (this._data.length > 0 && newRowData.length === 0) {
      const columnCount = Math.max(...this._data.map(row => row.length));
      newRowData.length = columnCount;
      newRowData.fill(undefined as any);
    }

    const historyEntry: ITableEditorHistoryEntry<TValue> = {
      type: 'row-insert',
      timestamp: Date.now(),
      data: {
        rowIdx,
        rowData: [...newRowData],
      },
    };
    this._history.push(historyEntry);

    this._data.splice(rowIdx, 0, newRowData);

    this._isEdited = true;

    this.emit('data-changed');
    this.emitHistoryChanged();
  }

  deleteRow(rowIdx: number): void {
    if (rowIdx < 0 || rowIdx >= this._data.length) {
      throw new Error(`Invalid row index: ${rowIdx}. Must be between 0 and ${this._data.length - 1}`);
    }

    const row = this._data[rowIdx];
    if (!row) {
      throw new Error(`Row ${rowIdx} does not exist`);
    }

    const deletedRowData = [...row];

    const historyEntry: ITableEditorHistoryEntry<TValue> = {
      type: 'row-delete',
      timestamp: Date.now(),
      data: {
        rowIdx,
        rowData: deletedRowData,
      },
    };
    this._history.push(historyEntry);

    this._data.splice(rowIdx, 1);

    this._isEdited = true;

    this.emit('data-changed');
    this.emitHistoryChanged();
  }

  resetData(newData: TValue[][]): void {
    this._data.length = 0;
    
    newData.forEach(row => {
      this._data.push([...row]);
    });

    this._history.clear();
    this._isEdited = false;

    this.emit('data-reset', newData);
    this.emitHistoryChanged();
  }

  undo(): boolean {
    const entry = this._history.undo();
    if (!entry) {
      return false;
    }

    this.applyHistoryEntryReverse(entry);
    this.emitHistoryChanged();
    return true;
  }

  redo(): boolean {
    const entry = this._history.redo();
    if (!entry) {
      return false;
    }

    this.applyHistoryEntry(entry);
    this.emitHistoryChanged();
    return true;
  }

  on<TEvent extends keyof TableEditorEvents<TValue>>(
    event: TEvent,
    listener: TableEditorEvents<TValue>[TEvent]
  ): Unsubscribe {
    return this._emitter.on(event, listener);
  }

  emit<TEvent extends keyof TableEditorEvents<TValue>>(
    event: TEvent,
    ...args: Parameters<TableEditorEvents<TValue>[TEvent]>
  ): void {
    this._emitter.emit(event, ...args);
  }

  private isValidPosition(position: ICellPosition): boolean {
    return (
      position.rowIdx >= 0 &&
      position.rowIdx < this._data.length &&
      position.colIdx >= 0 &&
      position.colIdx < (this._data[position.rowIdx]?.length || 0)
    );
  }

  private emitHistoryChanged(): void {
    this.emit('history-changed', this._history.canUndo, this._history.canRedo);
  }

  private applyHistoryEntry(entry: ITableEditorHistoryEntry<TValue>): void {
    switch (entry.type) {
      case 'cell-edit': {
        const data = entry.data as any;
        const { position, newValue } = data;
        const row = this._data[position.rowIdx];
        if (row) {
          row[position.colIdx] = newValue;
        }
        break;
      }
      case 'row-insert': {
        const data = entry.data as any;
        const { rowIdx, rowData } = data;
        this._data.splice(rowIdx, 0, [...rowData]);
        break;
      }
      case 'row-delete': {
        const data = entry.data as any;
        const { rowIdx } = data;
        this._data.splice(rowIdx, 1);
        break;
      }
    }
  }

  private applyHistoryEntryReverse(entry: ITableEditorHistoryEntry<TValue>): void {
    switch (entry.type) {
      case 'cell-edit': {
        const data = entry.data as any;
        const { position, oldValue } = data;
        const row = this._data[position.rowIdx];
        if (row) {
          row[position.colIdx] = oldValue;
        }
        break;
      }
      case 'row-insert': {
        const data = entry.data as any;
        const { rowIdx } = data;
        this._data.splice(rowIdx, 1);
        break;
      }
      case 'row-delete': {
        const data = entry.data as any;
        const { rowIdx, rowData } = data;
        this._data.splice(rowIdx, 0, [...rowData]);
        break;
      }
    }
  }
}
