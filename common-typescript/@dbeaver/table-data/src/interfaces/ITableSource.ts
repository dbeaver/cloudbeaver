import type { EmitterMixin } from 'nanoevents';
import type { TableSourceEvents } from './TableSourceEvents.js';
import type { ITableDatasetManager } from './ITableDatasetManager.js';
import type { ITableSourceOptions } from './ITableSourceOptions.js';

export interface ITableSource<TColumn, TValue, TOptions extends ITableSourceOptions = ITableSourceOptions> extends EmitterMixin<TableSourceEvents> {
  readonly datasetManager: ITableDatasetManager<TColumn, TValue>;
  readonly options: Partial<TOptions>;
  readonly isLoading: boolean;
  readonly isOutdated: boolean;
  readonly error: Error | null;

  setOptions(options: TOptions): void;
  setOutdated(): void;

  save(): Promise<void>;
  load(): Promise<void>;
}
