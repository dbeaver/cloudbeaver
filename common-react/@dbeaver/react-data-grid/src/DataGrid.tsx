// import { useSyncExternalStore } from 'react';
import DataGridBase, { type ColumnOrColumnGroup } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

export interface DataGridProps {
  getHeaderHeight?: () => number;
  getRowHeight?: (rowIdx: number) => number;
  getHeaderText: (colIdx: number) => string;
  getCellText: (rowIdx: number, colIdx: number) => string;
  getColumnCount: () => number;
  getRowCount: () => number;
  subscribeToStore: (onStoreChange: () => void) => () => void;
  className?: string;
}

export const DataGrid: React.FC<DataGridProps> = function DataGrid({
  getHeaderText,
  getCellText,
  getColumnCount,
  getRowCount,
  getHeaderHeight,
  getRowHeight,
  subscribeToStore,
  className,
}) {
  // const store = useSyncExternalStore(subscribeToStore, () => {
  //   return {
  //     columns: getColumnCount(),
  //     rows: getRowCount(),
  //   };
  // });

  const columns = new Array<ColumnOrColumnGroup<any, unknown>>(getColumnCount()).fill(null as any).map(
    (_, i) =>
      ({
        key: i + '',
        name: getHeaderText(i),
        renderCell: ({ rowIdx }) => getCellText(rowIdx, i),
      }) as ColumnOrColumnGroup<any, unknown>,
  );

  const rows = new Array(getRowCount()).fill({});

  return <DataGridBase columns={columns} rows={rows} className={className} headerRowHeight={getHeaderHeight?.()} rowHeight={getRowHeight} />;
};
