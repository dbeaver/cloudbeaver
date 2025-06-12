import type { EmitterMixin } from 'nanoevents';

export interface TableEditorEvents<TValue> {
  'data-changed': () => void;
  'data-reset': (newData: TValue[][]) => void;
  'history-changed': (canUndo: boolean, canRedo: boolean) => void;
}

export type TableEditorEventEmitter<TValue> = EmitterMixin<TableEditorEvents<TValue>>;
