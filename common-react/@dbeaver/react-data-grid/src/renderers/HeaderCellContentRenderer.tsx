import { memo, use, useRef } from 'react';
import { useDrag, useDrop, type DnDStoreProvider } from '@dbeaver/react-dnd';
import { DataGridCellHeaderContext } from '../DataGridHeaderCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';
import { HeaderDnDContext } from '../useHeaderDnD.js';
import { OrderButton } from './OrderButton.js';

interface Props {
  colIdx: number;
  tabIndex?: number;
}
export const HeaderCellContentRenderer = memo(function HeaderCellContentRenderer({ colIdx, tabIndex }: Props) {
  const dndHeaderContext = use(HeaderDnDContext);
  const cellHeaderContext = use(DataGridCellHeaderContext);
  const headerElement = useGridReactiveValue(cellHeaderContext?.headerElement, colIdx);
  const getHeaderText = useGridReactiveValue(headerElement ? undefined : cellHeaderContext?.headerText, colIdx);
  const isColumnSortable = useGridReactiveValue(cellHeaderContext?.columnSortable, colIdx);
  const onColumnSort = cellHeaderContext?.onColumnSort;
  const sortingState = useGridReactiveValue(cellHeaderContext?.columnSortingState, colIdx);

  const orderButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draggable = dndHeaderContext?.getCanDrag?.(colIdx) ?? false;
  const drag = useDrag({
    draggable,
    onDragStart(event, store) {
      if (dndHeaderContext?.id) {
        store.setData('dbeaver-react-data-grid-id', dndHeaderContext?.id);
      }
      store.setData('dbeaver-react-data-grid-col-idx', colIdx);
    },
    onDragEnd() {
      dndHeaderContext?.onDragEnd(colIdx);
    },
  });

  function canDrop(event: React.DragEvent<HTMLElement>, store: DnDStoreProvider | null) {
    const gridId = store?.getData('dbeaver-react-data-grid-id');
    return gridId === dndHeaderContext?.id;
  }
  const drop = useDrop({
    canDrop,
    onDragOver(event, store) {
      if (!canDrop(event, store)) {
        return;
      }

      const dragColIdx = store?.getData('dbeaver-react-data-grid-col-idx');
      const position = event.clientX - event.currentTarget.getBoundingClientRect().left;
      const width = event.currentTarget.offsetWidth;
      const isAfter = position > width / 2;

      dndHeaderContext?.onDragOver(dragColIdx, colIdx, isAfter);
    },
  });

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
      className="tw:w-full tw:h-full tw:content-center tw:flex tw:items-center tw:justify-between tw:gap-1 tw:outline-none tw:group"
      {...drag.props}
      {...drop.props}
    >
      <span className="tw:overflow-hidden tw:text-ellipsis">{headerElement ?? getHeaderText ?? ''}</span>
      {isColumnSortable && onColumnSort && <OrderButton ref={orderButtonRef} colIdx={colIdx} sortState={sortingState} onSort={onColumnSort} />}
    </div>
  );
});
