import type { ITableDataset } from './ITableDataset.js';

export interface ITableDatasetManager<TColumn, TValue> {
  readonly datasets: ITableDataset<TColumn, TValue>[];

  setDatasets(datasets: ITableDataset<TColumn, TValue>[]): void;
}
