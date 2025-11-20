/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef, useState } from 'react';
import { useDrag, useDrop } from '@dbeaver/react-dnd';

type DragPosition = 'before' | 'after';

export interface ITabDragAndDropOptions {
  tabId: string;
  stateKey: string | undefined;
  onReorder: ((draggedTabId: string, targetTabId: string, position: DragPosition) => void) | null;
}

export interface ITabDragAndDropResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  dropAllowed: boolean;
  dropPosition: DragPosition | undefined;
  dragProps: {
    draggable?: boolean;
    onDrag: (event: React.DragEvent<HTMLElement>) => void;
    onDragStart: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnd: (event: React.DragEvent<HTMLElement>) => void;
  };
  dropProps: {
    onDrop: (event: React.DragEvent<HTMLElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnter: (event: React.DragEvent<HTMLElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  };
}

const DRAG_TAB_ID = 'dbeaver-drag-tab-id';
const DRAG_TAB_STATE_KEY = 'dbeaver-tab-state-key';

export function useTabDragAndDrop({ tabId, stateKey, onReorder }: ITabDragAndDropOptions): ITabDragAndDropResult {
  const ref = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<DragPosition | undefined>(undefined);
  const [dropAllowed, setDropAllowed] = useState(false);

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const { isDragging, props: dragProps } = useDrag({
    draggable: !!stateKey,
    onDragStart: (event, store) => {
      event.stopPropagation();
      store.setData(DRAG_TAB_ID, tabId);
      store.setData(DRAG_TAB_STATE_KEY, stateKey);
    },
  });

  const { props: dropProps } = useDrop({
    canDrop: (event, store) => {
      const draggedTabId = store?.getData(DRAG_TAB_ID);
      const draggedStateKey = store?.getData(DRAG_TAB_STATE_KEY);

      const allowed = !!stateKey && draggedTabId !== tabId && draggedStateKey === stateKey;
      setDropAllowed(allowed);
      return allowed;
    },
    onDragOver: event => {
      event.preventDefault();
      event.stopPropagation();
      if (!ref.current) {
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      const position = event.clientX < midpoint ? 'before' : 'after';

      if (dropPosition !== position) {
        setDropPosition(position);
      }
    },
    onDragLeave: event => {
      if (!ref.current) {
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;

      const isOutside = x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;

      if (isOutside) {
        setDropPosition(undefined);
      }
    },
    onDrop: (event, store) => {
      event.preventDefault();
      event.stopPropagation();
      const draggedTabId = store?.getData(DRAG_TAB_ID);

      if (draggedTabId && draggedTabId !== tabId && dropPosition && onReorderRef.current) {
        onReorderRef.current(draggedTabId, tabId, dropPosition);
      }

      setDropPosition(undefined);
    },
  });

  return {
    ref,
    isDragging,
    dropAllowed,
    dropPosition,
    dragProps,
    dropProps,
  };
}
