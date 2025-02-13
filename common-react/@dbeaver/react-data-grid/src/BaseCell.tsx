import { use } from 'react';
import { Cell, type CellRendererProps } from 'react-data-grid';
import { DataGridCellContext } from './DataGridCellContext.js';
import { createCellMouseEvent } from './eventUtils.js';

export const BaseCell = function BaseCell<TRow, TSummaryRow>(props: CellRendererProps<TRow, TSummaryRow>) {
  const cellContext = use(DataGridCellContext);
  const tooltip = cellContext?.getCellTooltip?.(props.rowIdx, props.column.idx);

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    props.onClick?.(
      {
        rowIdx: props.rowIdx,
        row: props.row,
        column: props.column,
        selectCell(enableEditor) {
          props.selectCell({ rowIdx: props.rowIdx, idx: props.column.idx }, enableEditor);
        },
      },
      createCellMouseEvent(event),
    );
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    props.onDoubleClick?.(
      {
        rowIdx: props.rowIdx,
        row: props.row,
        column: props.column,
        selectCell(enableEditor) {
          props.selectCell({ rowIdx: props.rowIdx, idx: props.column.idx }, enableEditor);
        },
      },
      createCellMouseEvent(event),
    );
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    props.onContextMenu?.(
      {
        rowIdx: props.rowIdx,
        row: props.row,
        column: props.column,
        selectCell(enableEditor) {
          props.selectCell({ rowIdx: props.rowIdx, idx: props.column.idx }, enableEditor);
        },
      },
      createCellMouseEvent(event),
    );
  }

  const cellElement = cellContext?.getCellElement?.(
    props.rowIdx,
    props.column.idx,
    { ...props, onClick: handleClick, onDoubleClick: handleDoubleClick, onContextMenu: handleContextMenu },
    ({ onClick, onDoubleClick, onContextMenu, ...rest }) => {
      return (
        <Cell
          {...props}
          title={tooltip}
          onClick={(_, event) => onClick?.(event)}
          onDoubleClick={(_, event) => onDoubleClick?.(event)}
          onContextMenu={(_, event) => onContextMenu?.(event)}
          {...rest}
        />
      );
    },
  );
  return cellElement ?? <Cell title={tooltip} {...props} />;
};
