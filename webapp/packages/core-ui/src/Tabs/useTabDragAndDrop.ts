/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef, useState } from 'react';

export interface ITabDragAndDropOptions {
  tabId: string;
  dndType?: string;
  onReorder?: (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => void;
  enabled?: boolean;
}

export interface ITabDragAndDropResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  dropPosition: 'before' | 'after' | null;
  dragProps: {
    draggable: boolean;
    onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  };
}

const DEFAULT_DND_TYPE = 'application/x-cloudbeaver-tab';

export function useTabDragAndDrop({ tabId, dndType = DEFAULT_DND_TYPE, onReorder, enabled = true }: ITabDragAndDropOptions): ITabDragAndDropResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const draggedTabIdRef = useRef<string | null>(null);

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!enabled) {
      return;
    }

    setIsDragging(true);
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(dndType, tabId);
    event.dataTransfer.setData('text/plain', tabId);
    draggedTabIdRef.current = tabId;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropPosition(null);
    draggedTabIdRef.current = null;
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!enabled || !event.dataTransfer.types.includes(dndType) || !ref.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    const rect = ref.current.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = event.clientX < midpoint ? 'before' : 'after';

    if (dropPosition !== position) {
      setDropPosition(position);
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!enabled) {
      return;
    }

    if (event.dataTransfer.types.includes(dndType)) {
      event.preventDefault();
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    const isOutside = x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;

    if (isOutside) {
      setDropPosition(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const draggedTabId = event.dataTransfer.getData(dndType) || event.dataTransfer.getData('text/plain');

    if (draggedTabId && draggedTabId !== tabId && dropPosition && onReorderRef.current) {
      onReorderRef.current(draggedTabId, tabId, dropPosition);
    }

    setDropPosition(null);
  };

  return {
    ref,
    isDragging,
    dropPosition,
    dragProps: {
      draggable: enabled,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
