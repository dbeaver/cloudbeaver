import { memo, use } from 'react';
import { useDrag, useDrop, type DnDStoreProvider } from '@dbeaver/react-dnd';
import { DataGridCellHeaderContext } from '../DataGridHeaderCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';
import { HeaderDnDContext } from '../useHeaderDnD.js';

interface Props {
  colIdx: number;
}
export const HeaderCellContentRenderer = memo(function HeaderCellContentRenderer({ colIdx }: Props) {
  const dndHeaderContext = use(HeaderDnDContext);
  const cellHeaderContext = use(DataGridCellHeaderContext);
  const headerElement = useGridReactiveValue(cellHeaderContext?.headerElement, colIdx);
  const getHeaderText = useGridReactiveValue(headerElement ? undefined : cellHeaderContext?.headerText, colIdx);

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

  return (
    <div className="tw:h-full tw:content-center" {...drag.props} {...drop.props}>
      {headerElement ?? getHeaderText ?? ''}
    </div>
  );
});
