/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { reorderArray } from './reorderArray.js';

describe('reorderArray', () => {
  const array = ['a', 'b', 'c', 'd', 'e'];

  describe('with index target', () => {
    test('should move element forward', () => {
      const result = reorderArray(array, 'a', 2);
      expect(result).toEqual(['b', 'c', 'a', 'd', 'e']);
    });

    test('should move element backward', () => {
      const result = reorderArray(array, 'd', 1);
      expect(result).toEqual(['a', 'd', 'b', 'c', 'e']);
    });

    test('should return original array when source item not found', () => {
      const result = reorderArray(array, 'z', 2);
      expect(result).toBe(array);
    });

    test('should return original array when target index is invalid', () => {
      const result = reorderArray(array, 'a', -1);
      expect(result).toBe(array);
    });

    test('should move to start', () => {
      const result = reorderArray(array, 'e', 0);
      expect(result).toEqual(['e', 'a', 'b', 'c', 'd']);
    });

    test('should move to end', () => {
      const result = reorderArray(array, 'a', 4);
      expect(result).toEqual(['b', 'c', 'd', 'e', 'a']);
    });
  });

  describe('with item target', () => {
    test('should place source item before target', () => {
      const result = reorderArray(array, 'a', { item: 'c', position: 'before' });
      expect(result).toEqual(['b', 'a', 'c', 'd', 'e']);
    });

    test('should place element before first item', () => {
      const result = reorderArray(array, 'e', { item: 'a', position: 'before' });
      expect(result).toEqual(['e', 'a', 'b', 'c', 'd']);
    });

    test('should handle moving backward before', () => {
      const result = reorderArray(array, 'd', { item: 'b', position: 'before' });
      expect(result).toEqual(['a', 'd', 'b', 'c', 'e']);
    });

    test('should place source item after target', () => {
      const result = reorderArray(array, 'a', { item: 'c', position: 'after' });
      expect(result).toEqual(['b', 'c', 'a', 'd', 'e']);
    });

    test('should place element after last item', () => {
      const result = reorderArray(array, 'a', { item: 'e', position: 'after' });
      expect(result).toEqual(['b', 'c', 'd', 'e', 'a']);
    });

    test('should handle moving backward after', () => {
      const result = reorderArray(array, 'e', { item: 'b', position: 'after' });
      expect(result).toEqual(['a', 'b', 'e', 'c', 'd']);
    });

    test('should return original array when source item not found with item target', () => {
      const result = reorderArray(array, 'z', { item: 'c', position: 'before' });
      expect(result).toBe(array);
    });

    test('should return original array when target item not found', () => {
      const result = reorderArray(array, 'a', { item: 'z', position: 'before' });
      expect(result).toBe(array);
    });

    test('should return original array when source and target are the same', () => {
      const result = reorderArray(array, 'a', { item: 'a', position: 'before' });
      expect(result).toBe(array);
    });

    test('should work with numeric array', () => {
      const numArray = [1, 2, 3, 4, 5];
      const result = reorderArray(numArray, 1, { item: 4, position: 'before' });
      expect(result).toEqual([2, 3, 1, 4, 5]);
    });

    test('should work with object array', () => {
      const objArray = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const result = reorderArray(objArray, objArray[0], { item: objArray[2], position: 'before' });
      expect(result).toEqual([objArray[1], objArray[0], objArray[2]]);
    });
  });
});
