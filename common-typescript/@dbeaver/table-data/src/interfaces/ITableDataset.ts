export interface ITableDataset<TColumn, TValue> {
  readonly id: string;
  readonly columns: TColumn[];
  readonly rows: TValue[][];
}
