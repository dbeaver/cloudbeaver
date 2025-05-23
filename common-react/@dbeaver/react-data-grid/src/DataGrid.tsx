import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { DataGrid as DataGridBase, type ColumnOrColumnGroup, type CellSelectArgs, type DataGridHandle } from 'react-data-grid';
import { rowRenderer } from './renderers/rowRenderer.js';
import { cellRenderer } from './renderers/cellRenderer.js';
import { DataGridCellHeaderContext, type IDataGridHeaderCellContext } from './DataGridHeaderCellContext.js';
import { DataGridCellContext, type IDataGridCellContext } from './DataGridCellContext.js';
import type { IInnerRow } from './IInnerRow.js';
import type { IGridReactiveValue } from './IGridReactiveValue.js';
import { useGridReactiveValue } from './useGridReactiveValue.js';
import { mapCellContentRenderer } from './mapCellContentRenderer.js';
import { mapRenderHeaderCell } from './mapRenderHeaderCell.js';
import { mapEditCellRenderer } from './mapEditCellRenderer.js';
import { DataGridRowContext, type IDataGridRowContext } from './DataGridRowContext.js';
import './DataGrid.css';
import { HeaderDnDContext, useHeaderDnD } from './useHeaderDnD.js';

export interface ICellPosition {
  rowIdx: number;
  colIdx: number;
}

export interface DataGridCellKeyboardEvent extends React.KeyboardEvent<HTMLDivElement> {
  preventGridDefault: () => void;
  isGridDefaultPrevented: () => boolean;
}

export interface DataGridProps extends IDataGridCellContext, IDataGridRowContext, IDataGridHeaderCellContext, React.PropsWithChildren {
  getRowHeight?: (rowIdx: number) => number;
  getRowId?: (rowIdx: number) => React.Key;
  columnCount: IGridReactiveValue<number, []>;
  getColumnKey?: (colIdx: number) => string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  onFocus?: (position: ICellPosition) => void;
  onEditorOpen?: (position: ICellPosition) => void;
  onCellKeyDown?: (position: ICellPosition, event: DataGridCellKeyboardEvent) => void;
  className?: string;
}

export interface DataGridRef {
  selectCell: (position: ICellPosition) => void;
  scrollToCell: (position: Partial<ICellPosition>) => void;
  openEditor: (position: ICellPosition) => void;
}

export const DataGrid = forwardRef<DataGridRef, DataGridProps>(function DataGrid(
  {
    headerElement,
    getHeaderWidth,
    headerText,
    getHeaderOrder,
    getHeaderResizable,
    getHeaderHeight,
    getHeaderPinned,
    getHeaderDnD,
    cell,
    cellText,
    cellElement,
    cellTooltip,
    getCellEditable,
    columnCount,
    getColumnKey,
    rowCount,
    getRowId,
    getRowHeight,
    onHeaderReorder,
    onScroll,
    onScrollToBottom,
    onFocus,
    onCellChange,
    children,
    className,
    onCellKeyDown,
  },
  ref,
) {
  const rowsCount = useGridReactiveValue(rowCount);
  const columnsCount = useGridReactiveValue(columnCount);

  const gridKey = useRef(0);
  const rowsCountRef = useRef(rowsCount);
  const innerGridRef = useRef<DataGridHandle>(null);
  const columns = new Array<ColumnOrColumnGroup<IInnerRow, unknown>>(columnsCount)
    .fill(null as any)
    .map((_, i): ColumnOrColumnGroup<IInnerRow, unknown> => {
      const width = getHeaderWidth?.(i) ?? 'max-content';
      return {
        key: getColumnKey?.(i) ?? String(i),
        name: '',
        resizable: getHeaderResizable?.(i) ?? true,
        width,
        minWidth: 26,
        editable: row => getCellEditable?.(row.idx, i) ?? false,
        frozen: getHeaderPinned?.(i),
        renderHeaderCell: mapRenderHeaderCell(i),
        renderCell: mapCellContentRenderer(i),
        renderEditCell: mapEditCellRenderer(i),
      };
    });

  const dndHeaderContext = useHeaderDnD({ columns, onReorder: onHeaderReorder, getCanDrag: getHeaderDnD, getHeaderOrder });

  useImperativeHandle(ref, () => ({
    selectCell: (position: ICellPosition) => {
      innerGridRef.current?.selectCell({ idx: dndHeaderContext.getDataColIdx(position.colIdx), rowIdx: position.rowIdx });
    },
    scrollToCell: (position: Partial<ICellPosition>) => {
      innerGridRef.current?.scrollToCell({ idx: position.colIdx && dndHeaderContext.getDataColIdx(position.colIdx), rowIdx: position.rowIdx });
    },
    openEditor: (position: ICellPosition) => {
      innerGridRef.current?.selectCell({ idx: dndHeaderContext.getDataColIdx(position.colIdx), rowIdx: position.rowIdx }, true);
    },
  }));

  if (rowsCountRef.current !== rowsCount) {
    const previousRowCount = rowsCountRef.current;
    rowsCountRef.current = rowsCount;

    if (previousRowCount === 0) {
      // we trigger columns size recalculation when rows are added
      gridKey.current++;
    }
  }

  const rows = useMemo(
    () =>
      new Array<IInnerRow>(rowsCount).fill({ idx: 0 }).map((_, i) => ({
        idx: i,
      })),
    [rowsCount],
  );

  function handleCellFocus(args: CellSelectArgs<IInnerRow, unknown>) {
    onFocus?.({ colIdx: dndHeaderContext.getDataColIdx(args.column.idx), rowIdx: args.rowIdx });
  }

  function handleCellKeyDown(args: CellSelectArgs<IInnerRow, unknown>, event: DataGridCellKeyboardEvent) {
    onCellKeyDown?.({ colIdx: dndHeaderContext.getDataColIdx(args.column.idx), rowIdx: args.rowIdx }, event);
  }

  return (
    <HeaderDnDContext value={dndHeaderContext}>
      <DataGridRowContext value={{ rowCount, onScrollToBottom }}>
        <DataGridCellContext value={{ cell, cellText, cellElement, cellTooltip, onCellChange }}>
          <DataGridCellHeaderContext value={{ headerElement, headerText, getHeaderDnD }}>
            <DataGridBase
              key={gridKey.current}
              ref={innerGridRef}
              columns={dndHeaderContext.columns}
              rows={rows}
              className={className}
              headerRowHeight={getHeaderHeight?.()}
              onScroll={onScroll}
              rowHeight={getRowHeight ? row => getRowHeight(row.idx) : undefined}
              rowKeyGetter={getRowId ? row => getRowId(row.idx) : undefined}
              onSelectedCellChange={handleCellFocus}
              onCellKeyDown={handleCellKeyDown}
              renderers={{
                renderRow: rowRenderer,
                renderCell: cellRenderer,
                noRowsFallback: children,
              }}
              minimumRowsToRender={100}
            />
          </DataGridCellHeaderContext>
        </DataGridCellContext>
      </DataGridRowContext>
    </HeaderDnDContext>
  );
});
