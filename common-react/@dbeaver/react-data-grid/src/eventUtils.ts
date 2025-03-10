/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { CellMouseEvent } from 'react-data-grid';

export function createCellMouseEvent<E extends React.MouseEvent<HTMLDivElement>>(event: E): CellMouseEvent {
  let defaultPrevented = false;
  const cellEvent = {
    ...event,
    preventGridDefault() {
      defaultPrevented = true;
    },
    isGridDefaultPrevented() {
      return defaultPrevented;
    },
  };

  Object.setPrototypeOf(cellEvent, Object.getPrototypeOf(event));

  return cellEvent;
}
