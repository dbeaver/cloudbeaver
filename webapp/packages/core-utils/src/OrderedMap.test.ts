/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { OrderedMap } from './OrderedMap.js';

describe('OrderedMap', () => {
  it('should add and get items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');
    map.add(Infinity, 'infinity');
    map.add(NaN, 'nan');

    expect(map.get(1)).toBe('one');
    expect(map.get(2)).toBe('two');
    expect(map.get(3)).toBe('three');
    expect(map.get(Infinity)).toBe('infinity');
    expect(map.get(NaN)).toBe('nan');
  });

  it('should not get not exist item and return undefined', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    expect(map.get(4)).toBeUndefined();
    expect(map.get(Infinity)).toBeUndefined();
    expect(map.get(NaN)).toBeUndefined();
  });

  it('should addValue and get items', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.addValue('one');
    map.addValue('twoo');
    map.addValue('three');

    expect(map.get(3)).toBe('one');
    expect(map.get(4)).toBe('twoo');
    expect(map.get(5)).toBe('three');
  });

  it('should not override with addValue if it already exists', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.addValue('one');
    map.addValue('twoo');
    map.addValue('three');
    map.addValue('four');

    expect(map.get(4)).toBe('twoo');
  });

  it('should not addValue if no key fn', () => {
    const map = new OrderedMap<number, string>();
    expect(() => map.addValue('one')).toThrow();
  });

  it('should be ordered', () => {
    const map = new OrderedMap<number, string>();
    map.add(3, 'three');
    map.add(1, 'one');
    map.add(2, 'two');

    expect(map.keys).toEqual([3, 1, 2]);
    expect(map.values).toEqual(['three', 'one', 'two']);
  });

  it('should has items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');
    map.add(Infinity, 'infinity');
    map.add(NaN, 'nan');

    expect(map.has(1)).toBeTruthy();
    expect(map.has(2)).toBeTruthy();
    expect(map.has(3)).toBeTruthy();
    expect(map.has(Infinity)).toBeTruthy();
    expect(map.has(NaN)).toBeTruthy();
  });

  it('should not override items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(1, 'two');
    map.add(Infinity, 'infinity');
    map.add(Infinity, 'infinity2');
    map.add(NaN, 'nan');
    map.add(NaN, 'nan2');

    expect(map.get(1)).toBe('one');
    expect(map.get(Infinity)).toBe('infinity');
    expect(map.get(NaN)).toBe('nan');
  });

  it('should remove items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    map.remove(2);

    expect(map.get(2)).toBeUndefined();
    expect(map.keys).toEqual([1, 3]);
    expect(map.values).toEqual(['one', 'three']);
  });

  it('should not have non-existing items after removal', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    expect(map.has(4)).toBeFalsy();
    expect(map.get(4)).toBeUndefined();
    map.remove(4);
    expect(map.has(4)).toBeFalsy();
    expect(map.get(4)).toBeUndefined();
  });

  it('should remove all items', () => {
    const map = new OrderedMap<number, string>();
    map.add(1, 'one');
    map.add(2, 'two');
    map.add(3, 'three');

    map.removeAll();

    expect(map.keys).toEqual([]);
    expect(map.values).toEqual([]);
  });

  it('should throw bulk update items if no toKey fn', () => {
    const map = new OrderedMap<number, string>();

    expect(() => map.bulkUpdate(['one', 'two', 'three'])).toThrow();
  });

  it('should bulk update items', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.bulkUpdate(['o', 'tw', 'thr']);

    expect(map.keys).toEqual([1, 2, 3]);
    expect(map.values).toEqual(['o', 'tw', 'thr']);
  });

  it('should bulk rewrite items', () => {
    const toKey = (v: string) => v.length;
    const map = new OrderedMap<number, string>(toKey);
    map.bulkUpdate(['o', 'tw', 'thr']);
    map.bulkRewrite(['one', 'twoo', 'three']);

    expect(map.keys).toEqual([3, 4, 5]);
    expect(map.values).toEqual(['one', 'twoo', 'three']);
  });

  it('should sort items', () => {
    const map = new OrderedMap<number, string>();
    map.add(3, 'c');
    map.add(1, 'a');
    map.add(2, 'b');

    map.sort((a, b) => (a > b ? 1 : -1));

    expect(map.keys).toEqual([1, 2, 3]);
  });
});
