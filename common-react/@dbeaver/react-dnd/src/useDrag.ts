import { useId, useMemo, useRef, useState } from 'react';
import { DND_STORE_PREFIX, globalDnDStore, type DnDStoreProvider } from './store.js';

interface IDragOptions {
  draggable?: boolean;
  onDrag?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider) => void;
  onDragStart?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider) => void;
  onDragEnd?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider) => void;
}
interface IDrag {
  isDragging: boolean;
  props: {
    draggable?: boolean;
    onDrag: (event: React.DragEvent<HTMLElement>) => void;
    onDragStart: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnd: (event: React.DragEvent<HTMLElement>) => void;
  };
}

export function useDrag({ draggable, onDragStart, onDrag, onDragEnd }: IDragOptions = {}): IDrag {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const optionsRef = useRef<IDragOptions>({ draggable, onDragStart, onDrag, onDragEnd });
  optionsRef.current = { draggable, onDragStart, onDrag, onDragEnd };

  function handleDragStart(event: React.DragEvent<HTMLElement>) {
    if (!optionsRef.current.draggable) {
      return;
    }
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(`${DND_STORE_PREFIX}${id}`, id);
    setDragging(true);
    optionsRef.current.onDragStart?.(event, globalDnDStore.getProvider(id));
  }

  function handleDrag(event: React.DragEvent<HTMLElement>) {
    if (!optionsRef.current.draggable) {
      return;
    }
    optionsRef.current.onDrag?.(event, globalDnDStore.getProvider(id));
  }

  function handleDragEnd(event: React.DragEvent<HTMLElement>) {
    if (!optionsRef.current.draggable) {
      return;
    }
    setDragging(false);
    optionsRef.current.onDragEnd?.(event, globalDnDStore.getProvider(id));
    globalDnDStore.removeData(id);
  }

  return {
    isDragging: dragging,
    props: {
      draggable,
      ...useMemo(
        () => ({
          onDrag: handleDrag,
          onDragStart: handleDragStart,
          onDragEnd: handleDragEnd,
        }),
        [],
      ),
    },
  };
}
