import { useMemo, useRef } from 'react';
import { getStoreProvider, type DnDStoreProvider } from './store.js';

interface IDropOptions {
  canDrop?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider | null) => boolean;
  onDrop?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider | null) => void;
  onDragOver?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider | null) => void;
  onDragEnter?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider | null) => void;
  onDragLeave?: (event: React.DragEvent<HTMLElement>, provider: DnDStoreProvider | null) => void;
}

interface IDrop {
  props: {
    onDrop: (event: React.DragEvent<HTMLElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnter: (event: React.DragEvent<HTMLElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  };
}

export function useDrop({ canDrop, onDrop, onDragOver, onDragEnter, onDragLeave }: IDropOptions = {}): IDrop {
  const optionsRef = useRef<IDropOptions>({ canDrop, onDrop, onDragOver, onDragEnter, onDragLeave });
  optionsRef.current = { canDrop, onDrop, onDragOver, onDragEnter, onDragLeave };

  function handleOver(event: React.DragEvent<HTMLElement>) {
    const provider = getStoreProvider(event);
    const isDroppable = optionsRef.current.canDrop?.(event, provider);
    if (isDroppable) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
    optionsRef.current.onDragOver?.(event, provider);
  }

  function handleEnter(event: React.DragEvent<HTMLElement>) {
    const provider = getStoreProvider(event);
    optionsRef.current.onDragEnter?.(event, provider);
  }
  function handleLeave(event: React.DragEvent<HTMLElement>) {
    const provider = getStoreProvider(event);
    optionsRef.current.onDragLeave?.(event, provider);
  }
  function handleDrop(event: React.DragEvent<HTMLElement>) {
    const provider = getStoreProvider(event);
    optionsRef.current.onDrop?.(event, provider);
  }

  return {
    props: useMemo(
      () => ({
        onDrop: handleDrop,
        onDragOver: handleOver,
        onDragEnter: handleEnter,
        onDragLeave: handleLeave,
      }),
      [],
    ),
  };
}
