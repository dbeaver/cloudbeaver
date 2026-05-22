/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { getCellLookupPoint, type IRect, LOOKUP_INSET } from './getCellLookupPoint.js';

const BODY: IRect = { left: 100, top: 50, right: 900, bottom: 600 };

describe('getCellLookupPoint', () => {
  test('returns the cursor unchanged when it is well inside the body', () => {
    expect(getCellLookupPoint({ x: 500, y: 300 }, BODY)).toEqual({ x: 500, y: 300 });
  });

  test('clamps the x coordinate between the left and right edges', () => {
    expect(getCellLookupPoint({ x: -1000, y: 300 }, BODY).x).toBe(BODY.left + LOOKUP_INSET);
    expect(getCellLookupPoint({ x: 5000, y: 300 }, BODY).x).toBe(BODY.right - LOOKUP_INSET);
  });

  test('clamps the y coordinate between the top and bottom edges', () => {
    expect(getCellLookupPoint({ x: 500, y: -1000 }, BODY).y).toBe(BODY.top + LOOKUP_INSET);
    expect(getCellLookupPoint({ x: 500, y: 5000 }, BODY).y).toBe(BODY.bottom - LOOKUP_INSET);
  });

  test('clamps both axes when the cursor is dragged past a corner', () => {
    expect(getCellLookupPoint({ x: 5000, y: 5000 }, BODY)).toEqual({
      x: BODY.right - LOOKUP_INSET,
      y: BODY.bottom - LOOKUP_INSET,
    });
  });

  test('insets a cursor sitting exactly on the edge', () => {
    expect(getCellLookupPoint({ x: BODY.left, y: BODY.top }, BODY)).toEqual({
      x: BODY.left + LOOKUP_INSET,
      y: BODY.top + LOOKUP_INSET,
    });
  });

  test('always returns a point within the inset bounds', () => {
    const cursors = [
      { x: -9999, y: -9999 },
      { x: 9999, y: 9999 },
      { x: 500, y: 300 },
      { x: BODY.left, y: BODY.bottom },
    ];

    for (const cursor of cursors) {
      const point = getCellLookupPoint(cursor, BODY);

      expect(point.x).toBeGreaterThanOrEqual(BODY.left + LOOKUP_INSET);
      expect(point.x).toBeLessThanOrEqual(BODY.right - LOOKUP_INSET);
      expect(point.y).toBeGreaterThanOrEqual(BODY.top + LOOKUP_INSET);
      expect(point.y).toBeLessThanOrEqual(BODY.bottom - LOOKUP_INSET);
    }
  });
});
