import type { ColumnOrColumnGroup } from 'react-data-grid';
import type { IInnerRow } from './IInnerRow.js';
import { createContext, useId, useMemo, useState } from 'react';
import { reorderArray } from './reorderArray.js';

interface IHeaderDnDOptions {
  columns: Array<ColumnOrColumnGroup<IInnerRow, unknown>>;
  getCanDrag?: (colIdx: number) => boolean;
  onReorder?: (from: number, to: number) => void;
  getHeaderOrder?: () => number[];
}

interface IHeaderDnD {
  id: string;
  columns: Array<ColumnOrColumnGroup<IInnerRow, unknown>>;
  getDataColIdx: (virtualColIdx: number) => number;
  getVirtualColIdx: (dataColIdx: number) => number;
  getCanDrag?: (colIdx: number) => boolean;
  onDragOver: (dragColIdx: number, dropColIdx: number, isAfter: boolean) => void;
  onDragEnd: (colIdx: number) => void;
}

export const HeaderDnDContext = createContext<IHeaderDnD | null>(null);

export function useHeaderDnD({ columns, getCanDrag, onReorder, getHeaderOrder }: IHeaderDnDOptions): IHeaderDnD {
  const id = useId();
  const [activeDnDElement, setActiveDnDElement] = useState<number | null>(null);
  const [dragOverElement, setDragOverElement] = useState<[number, boolean] | null>(null);

  function getDataColIdx(virtualColIdx: number) {
    // Given a visible (ordered) column index, return the original data column index
    const order = getHeaderOrder?.();
    if (order) {
      return order[virtualColIdx] ?? virtualColIdx;
    }
    return virtualColIdx;
  }

  function getVirtualColIdx(dataColIdx: number) {
    // Given the original data column index, return its visible (ordered) index
    const order = getHeaderOrder?.();
    if (order) {
      return order.indexOf(dataColIdx);
    }
    return dataColIdx;
  }

  function onDragEnd(dragColIdx: number) {
    setActiveDnDElement(null);
    setDragOverElement(null);

    if (dragOverElement) {
      const isAfter = dragOverElement?.[1];
      let to = dragOverElement?.[0];

      if (isAfter) {
        to = getDataColIdx(getVirtualColIdx(to) + 1);
      }

      onReorder?.(dragColIdx, to);
    }
  }

  function onDragOver(dragColIdx: number, dropColIdx: number, isAfter: boolean) {
    setActiveDnDElement(dragColIdx);
    if (dragColIdx !== dropColIdx) {
      setDragOverElement([dropColIdx, isAfter]);
    }
  }

  columns = useMemo(() => columns.map((col, idx) => columns[getDataColIdx(idx)]!), [columns, getHeaderOrder]);

  if (activeDnDElement !== null && dragOverElement !== null) {
    const from = getVirtualColIdx(activeDnDElement);
    let to = getVirtualColIdx(dragOverElement[0]);
    const isAfter = dragOverElement[1];

    if (isAfter) {
      to++;
    }

    columns = reorderArray(columns, from, to);
  }

  return {
    id,
    columns,
    getDataColIdx,
    getVirtualColIdx,
    getCanDrag,
    onDragOver,
    onDragEnd,
  };
}
