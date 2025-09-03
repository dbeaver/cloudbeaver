import { memo, use, useMemo } from 'react';
import { Cell, type CellRendererProps } from 'react-data-grid';
import { DataGridCellContext, type IDataGridCellRenderer } from './DataGridCellContext.js';
import { createCellMouseEvent } from './eventUtils.js';
import { DataGridCellInnerContext, type IDataGridCellInnerContext } from './DataGridCellInnerContext.js';
import { useGridReactiveValue } from './useGridReactiveValue.js';
import { HeaderDnDContext } from './useHeaderDnD.js';

export const BaseCell = memo(function BaseCell<TRow, TSummaryRow>(props: CellRendererProps<TRow, TSummaryRow>) {
  const cellContext = use(DataGridCellContext);
  const dndContext = use(HeaderDnDContext)!;
  const virtualColIdx = props.column.idx;
  const dataColIdx = dndContext.getDataColIdx(props.column.idx);
  const rowIdx = props.rowIdx;
  const tooltip = useGridReactiveValue(cellContext?.cellTooltip, rowIdx, dataColIdx);

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    props.onCellClick?.(
      {
        rowIdx,
        row: props.row,
        column: props.column,
        selectCell(enableEditor) {
          props.selectCell(
            { rowIdx, idx: virtualColIdx },
            {
              enableEditor,
            },
          );
        },
      },
      createCellMouseEvent(event),
    );
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    props.onCellDoubleClick?.(
      {
        rowIdx,
        row: props.row,
        column: props.column,
        selectCell(enableEditor) {
          props.selectCell({ rowIdx, idx: virtualColIdx }, { enableEditor });
        },
      },
      createCellMouseEvent(event),
    );
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    props.onCellContextMenu?.(
      {
        rowIdx,
        row: props.row,
        column: props.column,
        selectCell(enableEditor) {
          props.selectCell({ rowIdx, idx: virtualColIdx }, { enableEditor });
        },
      },
      createCellMouseEvent(event),
    );
  }

  const mappedProps = useMemo(
    () => ({
      ...props,
      onCellClick: undefined,
      onCellContextMenu: undefined,
      onCellDoubleClick: undefined,
      isFocused: props.isCellSelected,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onContextMenu: handleContextMenu,
    }),
    Object.values(props),
  );

  const renderDefaultCell = useMemo<IDataGridCellRenderer>(
    () =>
      ({ onClick, onDoubleClick, onContextMenu, ...rest }) => {
        return (
          <Cell
            {...props}
            title={tooltip}
            onCellClick={(_, event) => onClick?.(event)}
            onCellDoubleClick={(_, event) => onDoubleClick?.(event)}
            onCellContextMenu={(_, event) => onContextMenu?.(event)}
            {...rest}
            isCellSelected={props.isCellSelected || rest.isFocused || false}
          />
        );
      },
    [...Object.values(props), tooltip],
  );

  const cellElement = useGridReactiveValue(cellContext?.cellElement, rowIdx, dataColIdx, mappedProps, renderDefaultCell);

  const innerCellContext = useMemo<IDataGridCellInnerContext>(() => ({ isFocused: props.isCellSelected }), [props.isCellSelected]);
  return <DataGridCellInnerContext value={innerCellContext}>{cellElement ?? <Cell title={tooltip} {...props} />}</DataGridCellInnerContext>;
}) as <TRow, TSummaryRow>(props: CellRendererProps<TRow, TSummaryRow>) => React.ReactNode;
