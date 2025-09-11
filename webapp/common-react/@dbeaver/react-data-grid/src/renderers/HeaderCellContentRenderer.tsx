import { memo, use } from 'react';
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
  const onHeaderKeyDown = cellHeaderContext?.onHeaderKeyDown;
  const sortingState = useGridReactiveValue(cellHeaderContext?.columnSortingState, colIdx);

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

  function handleSort(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) {
    if (!onColumnSort) return;

    const nextSortState = sortingState === 'asc' ? 'desc' : sortingState === 'desc' ? null : 'asc';
    onColumnSort(colIdx, nextSortState, e.ctrlKey || e.metaKey);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    onHeaderKeyDown?.(event);

    if ((event.key === 'Enter' || event.key === ' ') && isColumnSortable && onColumnSort) {
      event.preventDefault();
      handleSort(event);
    }
  }

  return (
    <div
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      className="tw:w-full tw:h-full tw:content-center tw:flex tw:items-center tw:justify-between tw:gap-1 tw:outline-none tw:group"
      {...drag.props}
      {...drop.props}
    >
      <span className="tw:overflow-hidden tw:h-full tw:text-ellipsis">{headerElement ?? getHeaderText ?? ''}</span>
      {isColumnSortable && onColumnSort && <OrderButton sortState={sortingState} onClick={handleSort} />}
    </div>
  );
});
