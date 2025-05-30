// Main interfaces
export type { ITableEditor } from './ITableEditor.js';
export type { ICellPosition } from './ICellPosition.js';
export type { ITableEditorFactory } from './ITableEditorFactory.js';

// History interfaces
export type {
  ITableEditorHistory,
  ITableEditorHistoryEntry,
  ICellEditEntry,
  IRowInsertEntry,
  IRowDeleteEntry,
} from './ITableEditorHistory.js';

// History implementation
export { TableEditorHistory } from './TableEditorHistory.js';

// Table editor implementation
export { TableEditor } from './TableEditor.js';

// Event interfaces
export type {
  TableEditorEvents,
  TableEditorEventEmitter,
} from './TableEditorEvents.js';
