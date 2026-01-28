/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getMenuLabelClipped } from './getMenuLabelClipped.js';

describe('getMenuLabelClipped', () => {
  it('should return original label and no tooltip when label is shorter than limiter', () => {
    const result = getMenuLabelClipped('Short label', 8, 30);
    expect(result.clippedLabel).toBe('Short label');
    expect(result.tooltip).toBeUndefined();
  });

  it('should clip label and return tooltip when label exceeds limiter', () => {
    const longLabel = 'This is a very long label that exceeds the limiter';
    const result = getMenuLabelClipped(longLabel, 8, 30);
    expect(result.clippedLabel).not.toBe(longLabel);
    expect(result.clippedLabel).toContain(' ... ');
    expect(result.tooltip).toBe(longLabel);
  });

  it('should use default sideLength of 8 when not provided', () => {
    const longLabel = 'This is a very long label that exceeds the limiter';
    const result = getMenuLabelClipped(longLabel, undefined, 30);
    expect(result.clippedLabel).toMatch(/^.{8} \.\.\. .{8}$/);
    expect(result.tooltip).toBe(longLabel);
  });

  it('should use default limiter of 30 when not provided', () => {
    const label = '12345678901234567890123456789'; // exactly 29 characters
    const result = getMenuLabelClipped(label, 8);
    expect(result.clippedLabel).toBe(label);
    expect(result.tooltip).toBeUndefined();
  });

  it('should use custom sideLength', () => {
    const longLabel = 'This is a very long label that exceeds the limiter';
    const result = getMenuLabelClipped(longLabel, 5, 30);
    expect(result.clippedLabel).toMatch(/^.{5} \.\.\. .{5}$/);
    expect(result.tooltip).toBe(longLabel);
  });

  it('should use custom limiter', () => {
    const label = '1234567890123456789'; // exactly 19 characters
    const result = getMenuLabelClipped(label, 8, 20);
    expect(result.clippedLabel).toBe(label);
    expect(result.tooltip).toBeUndefined();
  });

  it('should handle label exactly at limiter length', () => {
    const label = '123456789012345678901234567890'; // exactly 30 characters
    const result = getMenuLabelClipped(label, 8, 30);
    expect(result.clippedLabel).toBe('12345678 ... 34567890');
    expect(result.tooltip).toBe(label);
  });

  it('should handle label one character longer than limiter', () => {
    const label = '1234567890123456789012345678901'; // 31 characters
    const result = getMenuLabelClipped(label, 8, 30);
    expect(result.clippedLabel).not.toBe(label);
    expect(result.clippedLabel).toContain(' ... ');
    expect(result.tooltip).toBe(label);
  });

  it('should handle very long labels', () => {
    const veryLongLabel = 'A'.repeat(100);
    const result = getMenuLabelClipped(veryLongLabel, 8, 30);
    expect(result.clippedLabel.length).toBeLessThan(veryLongLabel.length);
    expect(result.clippedLabel).toContain(' ... ');
    expect(result.tooltip).toBe(veryLongLabel);
  });

  it('should handle empty string', () => {
    const result = getMenuLabelClipped('', 8, 30);
    expect(result.clippedLabel).toBe('');
    expect(result.tooltip).toBeUndefined();
  });

  it('should handle sideLength of 0', () => {
    const longLabel = 'This is a very long label that exceeds the limiter';
    const result = getMenuLabelClipped(longLabel, 0, 30);
    expect(result.clippedLabel).toContain(' ... ');
    expect(result.tooltip).toBe(longLabel);
  });

  it('should handle very small sideLength', () => {
    const longLabel = 'This is a very long label that exceeds the limiter';
    const result = getMenuLabelClipped(longLabel, 2, 30);
    expect(result.clippedLabel).toMatch(/^.{2} \.\.\. .{2}$/);
    expect(result.tooltip).toBe(longLabel);
  });

  it('should handle large sideLength', () => {
    const longLabel = 'This is a very long label that exceeds the limiter';
    const result = getMenuLabelClipped(longLabel, 15, 30);
    expect(result.clippedLabel).toMatch(/^.{15} \.\.\. .{15}$/);
    expect(result.tooltip).toBe(longLabel);
  });
});
