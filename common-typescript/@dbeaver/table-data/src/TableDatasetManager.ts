import type { ITableDataset } from './interfaces/ITableDataset.js';
import type { ITableDatasetManager } from './interfaces/ITableDatasetManager.js';

export class TableDatasetManager<TColumn, TValue> implements ITableDatasetManager<TColumn, TValue> {
  get datasets(): ITableDataset<TColumn, TValue>[] {
    return this.#datasets;
  }

  #datasets: ITableDataset<TColumn, TValue>[] = [];

  constructor() {
    this.#datasets = [];
  }

  setDatasets(datasets: ITableDataset<TColumn, TValue>[]): void {
    this.#datasets = datasets;
  }
}
