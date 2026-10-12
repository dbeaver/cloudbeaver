/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';

import { useClipboard, useObjectRef } from '@cloudbeaver/core-blocks';
import { isCopyShortcut } from '@cloudbeaver/core-utils';
import type { DataGridCellKeyboardEvent, ICellPosition } from '@dbeaver/react-data-grid';

const GRID_CELL_SELECTOR = '[role="gridcell"]';

type CellCopyKeyboardEvent = React.KeyboardEvent<HTMLElement> & Partial<Pick<DataGridCellKeyboardEvent, 'preventGridDefault'>>;

interface Options<Cell> {
  getText?: (cell: Cell) => string | null;
}

export function useCellCopy<Cell = ICellPosition>({ getText }: Options<Cell> = {}): {
  handleKeyDown: (cell: Cell, event: CellCopyKeyboardEvent) => boolean;
} {
  const copy = useClipboard();
  const props = useObjectRef({ getText, copy });

  const handleKeyDown = useCallback(
    (cell: Cell, event: CellCopyKeyboardEvent): boolean => {
      if (event.defaultPrevented || !isCopyShortcut(event.nativeEvent)) {
        return false;
      }

      let text: string | null;

      if (props.getText) {
        text = props.getText(cell);
      } else {
        const element = (event.target as HTMLElement).closest<HTMLElement>(GRID_CELL_SELECTOR);
        text = element?.innerText || null;
      }

      if (text === null) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();
      event.preventGridDefault?.();
      props.copy(text);
      return true;
    },
    [props],
  );

  return { handleKeyDown };
}
