import { forwardRef, useImperativeHandle, useRef } from 'react';
import DataGridBase, { type ColumnOrColumnGroup, type CellSelectArgs, type DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { rowRenderer } from './renderers/rowRenderer.js';
import { cellRenderer } from './renderers/cellRenderer.js';
import { DataGridCellHeaderContext, type IDataGridHeaderCellContext } from './DataGridHeaderCellContext.js';
import { DataGridCellContext, type IDataGridCellContext } from './DataGridCellContext.js';
import textEditor from './editors/textEditor.js';
import type { IInnerRow } from './IInnerRow.js';

export interface ICellPosition {
  rowIdx: number;
  colIdx: number;
}

export interface DataGridProps extends IDataGridCellContext, IDataGridHeaderCellContext, React.PropsWithChildren {
  getRowHeight?: (rowIdx: number) => number;
  getRowId?: (rowIdx: number) => React.Key;
  getRowCount: () => number;
  getColumnCount: () => number;
  getColumnKey?: (colIdx: number) => string;
  subscribeToStore?: (onStoreChange: () => void) => () => void;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  onFocus?: (position: ICellPosition) => void;
  onEditorOpen?: (position: ICellPosition) => void;
  className?: string;
}

export interface DataGridRef {
  selectCell: (position: ICellPosition) => void;
  scrollToCell: (position: Partial<ICellPosition>) => void;
  openEditor: (position: ICellPosition) => void;
}

export const DataGrid = forwardRef<DataGridRef, DataGridProps>(function DataGrid(
  {
    getHeaderElement,
    getHeaderWidth,
    getHeaderText,
    getHeaderTooltip,
    getHeaderResizable,
    getHeaderHeight,
    getHeaderPinned,
    getCell,
    getCellText,
    getCellElement,
    getCellTooltip,
    getCellEditable,
    getColumnCount,
    getColumnKey,
    getRowCount,
    getRowId,
    getRowHeight,
    onScroll,
    onFocus,
    onCellChange,
    subscribeToStore,
    children,
    className,
  },
  ref,
) {
  // const store = useSyncExternalStore(subscribeToStore, () => {
  //   return {
  //     columns: getColumnCount(),
  //     rows: getRowCount(),
  //   };
  // });

  const gridKey = useRef(0);
  const rowsCount = useRef(getRowCount());
  const innerGridRef = useRef<DataGridHandle>(null);
  const columns = new Array<ColumnOrColumnGroup<IInnerRow, unknown>>(getColumnCount())
    .fill(null as any)
    .map((_, i): ColumnOrColumnGroup<IInnerRow, unknown> => {
      const width = getHeaderWidth?.(i) ?? 'max-content';
      return {
        key: getColumnKey?.(i) ?? String(i),
        name: '',
        resizable: getHeaderResizable?.(i) ?? true,
        width,
        minWidth: 24,
        editable: row => getCellEditable?.(row.idx, i) ?? false,
        maxWidth: 900, // TODO: there is a bug with auto-resize if this value is too high or not set
        frozen: getHeaderPinned?.(i),
        renderHeaderCell: ({ column }) => getHeaderElement?.(column.idx) ?? getHeaderText?.(column.idx) ?? '',
        renderCell: ({ rowIdx }) => getCell(rowIdx, i),
        renderEditCell: ({ rowIdx, column, onClose }) => textEditor({ rowIdx, colIdx: column.idx, onClose: () => onClose() }),
      };
    });

  useImperativeHandle(ref, () => ({
    selectCell: (position: ICellPosition) => {
      innerGridRef.current?.selectCell({ idx: position.colIdx, rowIdx: position.rowIdx });
    },
    scrollToCell: (position: Partial<ICellPosition>) => {
      innerGridRef.current?.scrollToCell({ idx: position.colIdx, rowIdx: position.rowIdx });
    },
    openEditor: (position: ICellPosition) => {
      innerGridRef.current?.selectCell({ idx: position.colIdx, rowIdx: position.rowIdx }, true);
    },
  }));

  if (rowsCount.current !== getRowCount()) {
    const previousRowCount = rowsCount.current;
    rowsCount.current = getRowCount();

    if (previousRowCount === 0) {
      // we trigger columns size recalculation when rows are added
      gridKey.current++;
    }
  }

  const rows = new Array<IInnerRow>(rowsCount.current).fill({ idx: 0 }).map((_, i) => ({
    idx: i,
  }));

  function handleCellFocus(args: CellSelectArgs<IInnerRow, unknown>) {
    onFocus?.({ colIdx: args.column.idx, rowIdx: args.rowIdx });
  }

  return (
    <DataGridCellContext value={{ getCell, getCellText, getCellElement, getCellTooltip, onCellChange }}>
      <DataGridCellHeaderContext value={{ getHeaderText, getHeaderTooltip }}>
        <DataGridBase
          key={gridKey.current}
          ref={innerGridRef}
          columns={columns}
          rows={rows}
          className={className}
          headerRowHeight={getHeaderHeight?.()}
          onScroll={onScroll}
          rowHeight={getRowHeight ? row => getRowHeight(row.idx) : undefined}
          rowKeyGetter={getRowId ? row => getRowId(row.idx) : undefined}
          onSelectedCellChange={handleCellFocus}
          renderers={{
            renderRow: rowRenderer,
            renderCell: cellRenderer,
            noRowsFallback: children,
          }}
        />
      </DataGridCellHeaderContext>
    </DataGridCellContext>
  );
});
