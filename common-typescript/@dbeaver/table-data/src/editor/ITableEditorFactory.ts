import type { ITableEditor } from './ITableEditor.js';

export interface ITableEditorFactory {
  create<TValue>(initialData?: TValue[][]): ITableEditor<TValue>;
}
