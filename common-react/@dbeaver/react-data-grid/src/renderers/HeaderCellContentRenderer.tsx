import { use, useRef } from 'react';
import { DataGridCellHeaderContext } from '../DataGridHeaderCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';
import { OrderButton } from './OrderButton.js';

interface Props {
  colIdx: number;
  tabIndex?: number;
}
export function HeaderCellContentRenderer({ colIdx, tabIndex }: Props) {
  const cellHeaderContext = use(DataGridCellHeaderContext);
  const headerElement = useGridReactiveValue(cellHeaderContext?.headerElement, colIdx);
  const getHeaderText = useGridReactiveValue(headerElement ? undefined : cellHeaderContext?.headerText, colIdx);
  const isColumnSortable = useGridReactiveValue(cellHeaderContext?.columnSortable, colIdx);
  const onColumnSort = cellHeaderContext?.onColumnSort;
  const sortingState = useGridReactiveValue(cellHeaderContext?.columnSortingState, colIdx);

  const orderButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey && isColumnSortable && onColumnSort && orderButtonRef.current !== document.activeElement) {
      e.preventDefault();
      e.stopPropagation();
      containerRef.current?.parentElement?.setAttribute('aria-selected', 'false');
      orderButtonRef.current?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      className="tw:w-full tw:flex tw:items-center tw:justify-between tw:gap-1 tw:outline-none tw:group"
    >
      <span className="tw:overflow-hidden tw:text-ellipsis">{headerElement ?? getHeaderText ?? ''}</span>
      {isColumnSortable && onColumnSort && <OrderButton ref={orderButtonRef} colIdx={colIdx} sortState={sortingState} onSort={onColumnSort} />}
    </div>
  );
}
