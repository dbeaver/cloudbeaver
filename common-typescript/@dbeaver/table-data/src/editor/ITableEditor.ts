import type { ICellPosition } from './ICellPosition.js';
import type { ITableEditorHistory } from './ITableEditorHistory.js';
import type { TableEditorEventEmitter } from './TableEditorEvents.js';

// Main table editor interface
export interface ITableEditor<TValue> extends TableEditorEventEmitter<TValue> {
  // Data access
  readonly data: readonly (readonly TValue[])[];
  readonly isEdited: boolean;
  readonly rowCount: number;

  // Cell operations
  getCellValue(position: ICellPosition): TValue | undefined;
  setCellValue(position: ICellPosition, value: TValue): void;

  // Row operations
  insertRow(rowIdx: number, rowData?: TValue[]): void;
  deleteRow(rowIdx: number): void;

  // Data operations
  resetData(newData: TValue[][]): void;

  // History operations
  readonly history: ITableEditorHistory<TValue>;
  undo(): boolean;
  redo(): boolean;
}
