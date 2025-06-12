import type { EmitterMixin } from 'nanoevents';
import type { ITableDataset } from './ITableDataset.js';
import type { ITableSource } from './ITableSource.js';
import type { TableEvents } from './TableEvents.js';
import type { ITableSourceOptions } from './ITableSourceOptions.js';

export interface ITableData<TColumn, TValue, TOptions extends ITableSourceOptions = ITableSourceOptions> extends EmitterMixin<TableEvents> {
  readonly id: string;
  readonly isLoading: boolean;
  readonly isOutdated: boolean;
  readonly datasets: ITableDataset<TColumn, TValue>[];

  readonly source: ITableSource<TColumn, TValue, TOptions>;

  setSource(source: ITableSource<TColumn, TValue, TOptions>): void;

  save(): Promise<void>;
}
