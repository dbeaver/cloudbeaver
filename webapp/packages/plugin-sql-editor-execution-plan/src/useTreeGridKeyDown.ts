/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCompositeContext } from '@dbeaver/ui-kit';

interface Options {
  expanded: boolean | undefined;
  parentItemId?: string;
  setExpanded?: (expanded: boolean) => void;
}

/**
 * ArrowRight expands or moves to the first child,
 * ArrowLeft collapses or moves to the parent row.
 * Vertical navigation is handled by the composite.
 */
export function useTreeGridKeyDown({ expanded, parentItemId, setExpanded }: Options): (event: React.KeyboardEvent<HTMLElement>) => void {
  const compositeStore = useCompositeContext();

  return function handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowRight':
        if (expanded === undefined) {
          return;
        }

        event.preventDefault();

        if (expanded) {
          compositeStore?.move(compositeStore.next());
        } else {
          setExpanded?.(true);
        }
        break;
      case 'ArrowLeft':
        if (expanded) {
          event.preventDefault();
          setExpanded?.(false);
        } else if (parentItemId) {
          event.preventDefault();
          compositeStore?.move(parentItemId);
        }
        break;
    }
  };
}
