/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { reorderArray, reorderArrayWithOrder } from './reorderArray.js';

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

  describe('with from and to indices', () => {
    test('should move element forward', () => {
      const result = reorderArray(array, 0, 2);
      expect(result).toEqual(['b', 'c', 'a', 'd', 'e']);
    });

    test('should move element backward', () => {
      const result = reorderArray(array, 3, 1);
      expect(result).toEqual(['a', 'd', 'b', 'c', 'e']);
    });

    test('should move to start', () => {
      const result = reorderArray(array, 4, 0);
      expect(result).toEqual(['e', 'a', 'b', 'c', 'd']);
    });

    test('should move to end', () => {
      const result = reorderArray(array, 0, 4);
      expect(result).toEqual(['b', 'c', 'd', 'e', 'a']);
    });

    test('should return original array when from index is out of bounds', () => {
      const result = reorderArray(array, -1, 2);
      expect(result).toBe(array);
    });

    test('should return original array when to index is out of bounds', () => {
      const result = reorderArray(array, 0, 10);
      expect(result).toBe(array);
    });

    test('should handle same from and to', () => {
      const result = reorderArray(array, 2, 2);
      expect(result).toEqual(array);
    });
  });
});

describe('reorderArrayWithOrder', () => {
  test('should reorder items and update order property when moving item after target', () => {
    const items = [
      { id: '1', order: 0 },
      { id: '2', order: 1 },
      { id: '3', order: 2 },
      { id: '4', order: 3 },
    ];

    reorderArrayWithOrder(items, '1', '3', 'after'); // 2, 3, 1, 4

    expect(items.find(item => item.id === '1')?.order).toBe(2);
    expect(items.find(item => item.id === '2')?.order).toBe(0);
    expect(items.find(item => item.id === '3')?.order).toBe(1);
    expect(items.find(item => item.id === '4')?.order).toBe(3);
  });

  test('should reorder items and update order property when moving item before target', () => {
    const items = [
      { id: '1', order: 0 },
      { id: '2', order: 1 },
      { id: '3', order: 2 },
      { id: '4', order: 3 },
    ];

    reorderArrayWithOrder(items, '4', '2', 'before'); // 1, 4, 2, 3

    expect(items.find(item => item.id === '1')?.order).toBe(0);
    expect(items.find(item => item.id === '2')?.order).toBe(2);
    expect(items.find(item => item.id === '3')?.order).toBe(3);
    expect(items.find(item => item.id === '4')?.order).toBe(1);
  });

  test('should handle unsorted array by order', () => {
    const items = [
      { id: 'a', order: 2 },
      { id: 'b', order: 0 },
      { id: 'c', order: 1 },
    ];

    reorderArrayWithOrder(items, 'a', 'c', 'before'); // b, a, c

    expect(items.find(item => item.id === 'b')?.order).toBe(0);
    expect(items.find(item => item.id === 'a')?.order).toBe(1);
    expect(items.find(item => item.id === 'c')?.order).toBe(2);
  });

  test('should mutate the original array', () => {
    const items = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ];

    const originalRef = items;
    reorderArrayWithOrder(items, 'c', 'a', 'before');

    expect(items).toBe(originalRef);
  });

  test('should work with custom property names using options', () => {
    const items = [
      { key: 'x', position: 0 },
      { key: 'y', position: 1 },
      { key: 'z', position: 2 },
    ];

    reorderArrayWithOrder(items, 'z', 'x', 'after', {
      getId: item => item.key,
      getOrder: item => item.position,
      setOrder: (item, order) => { item.position = order; },
    });

    expect(items.find(item => item.key === 'x')?.position).toBe(0);
    expect(items.find(item => item.key === 'y')?.position).toBe(2);
    expect(items.find(item => item.key === 'z')?.position).toBe(1);
  });
});
