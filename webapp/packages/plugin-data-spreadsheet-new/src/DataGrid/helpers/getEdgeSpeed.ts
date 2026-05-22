/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { clamp } from '@dbeaver/js-helpers';

export const EDGE_SIZE = 48;
export const MIN_SCROLL_SPEED = 1;
export const MAX_SCROLL_SPEED = 128;

function depthToSpeed(depth: number): number {
  const ratio = clamp(depth / EDGE_SIZE, 0, 1);
  return Math.round(MIN_SCROLL_SPEED + ratio * (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED));
}

export function getEdgeSpeed(position: number, start: number, end: number): number {
  const depthAtStart = start + EDGE_SIZE - position;
  const depthAtEnd = position - (end - EDGE_SIZE);

  if (depthAtStart > 0) {
    return -depthToSpeed(depthAtStart);
  }
  if (depthAtEnd > 0) {
    return depthToSpeed(depthAtEnd);
  }
  return 0;
}
