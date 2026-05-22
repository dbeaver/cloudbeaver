/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { EDGE_SIZE, getEdgeSpeed, MAX_SCROLL_SPEED, MIN_SCROLL_SPEED } from './getEdgeSpeed.js';

const START = 0;
const END = 1000;

describe('getEdgeSpeed', () => {
  test('returns 0 while the cursor stays in the inner area', () => {
    expect(getEdgeSpeed((START + END) / 2, START, END)).toBe(0);
    expect(getEdgeSpeed(START + EDGE_SIZE, START, END)).toBe(0);
    expect(getEdgeSpeed(END - EDGE_SIZE, START, END)).toBe(0);
  });

  test('scrolls toward the start edge with a negative speed', () => {
    expect(getEdgeSpeed(START + EDGE_SIZE / 2, START, END)).toBeLessThan(0);
    expect(getEdgeSpeed(START + 1, START, END)).toBeLessThan(0);
  });

  test('scrolls toward the end edge with a positive speed', () => {
    expect(getEdgeSpeed(END - EDGE_SIZE / 2, START, END)).toBeGreaterThan(0);
    expect(getEdgeSpeed(END - 1, START, END)).toBeGreaterThan(0);
  });

  test('reaches MAX_SCROLL_SPEED right at the edge', () => {
    expect(getEdgeSpeed(START, START, END)).toBe(-MAX_SCROLL_SPEED);
    expect(getEdgeSpeed(END, START, END)).toBe(MAX_SCROLL_SPEED);
  });

  test('stays at MAX_SCROLL_SPEED when the cursor is dragged past the edge', () => {
    expect(getEdgeSpeed(START - 500, START, END)).toBe(-MAX_SCROLL_SPEED);
    expect(getEdgeSpeed(END + 500, START, END)).toBe(MAX_SCROLL_SPEED);
  });

  test('speeds up the closer the cursor gets to the edge', () => {
    const farther = getEdgeSpeed(END - EDGE_SIZE + 5, START, END);
    const closer = getEdgeSpeed(END - 5, START, END);
    const atEdge = getEdgeSpeed(END, START, END);

    expect(farther).toBeGreaterThan(0);
    expect(closer).toBeGreaterThan(farther);
    expect(atEdge).toBeGreaterThan(closer);
  });

  test('keeps the non-zero speed within the [MIN, MAX] range', () => {
    for (let depth = 1; depth <= EDGE_SIZE; depth++) {
      const speed = Math.abs(getEdgeSpeed(END - EDGE_SIZE + depth, START, END));

      expect(speed).toBeGreaterThanOrEqual(MIN_SCROLL_SPEED);
      expect(speed).toBeLessThanOrEqual(MAX_SCROLL_SPEED);
    }
  });
});
