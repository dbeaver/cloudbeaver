/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { clamp } from '@dbeaver/js-helpers';

import type { IMousePosition } from '../useGridAutoScroll.js';

export interface IRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// clear of scrollbars
export const LOOKUP_INSET = 18;

/**
 * Clamps the cursor into the grid body so a cell can be resolved via elementFromPoint even when the cursor is dragged off-grid.
 */
export function getCellLookupPoint(cursor: IMousePosition, body: IRect): IMousePosition {
  return {
    x: clamp(cursor.x, body.left + LOOKUP_INSET, body.right - LOOKUP_INSET),
    y: clamp(cursor.y, body.top + LOOKUP_INSET, body.bottom - LOOKUP_INSET),
  };
}
