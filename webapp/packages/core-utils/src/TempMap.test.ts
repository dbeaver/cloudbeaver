/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { TempMap } from './TempMap.js';

describe('TempMap', () => {
  it('should create empty map', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    expect(map.size).toBe(0);
    expect(target.size).toBe(0);
    expect(Array.from(map.entries()).length).toBe(0);
  });

  it('should set and get values', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');

    expect(map.get('test')).toBe('test value');
    expect(map.get('test2')).toBe('test value2');
  });

  it('should delete values', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.delete('test');

    expect(map.get('test')).toBeUndefined();
    expect(map.isDeleted('test')).toBe(true);
  });

  it('should clear values', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');
    map.clear();

    expect(map.get('test')).toBeUndefined();
    expect(map.get('test2')).toBeUndefined();
  });

  it('should delete deleted values after map being cleared', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.delete('test');
    expect(map.isDeleted('test')).toBe(true);
    map.clear();

    expect(map.get('test')).toBeUndefined();
    expect(map.isDeleted('test')).toBe(false);
  });

  it('should remove item from deleted map if it was set again', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.delete('test');

    expect(map.isDeleted('test')).toBe(true);

    map.set('test', 'test value2');

    expect(map.get('test')).toBe('test value2');
    expect(map.isDeleted('test')).toBe(false);
  });

  it('should have for each items', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');

    const values: string[] = [];
    const keys: string[] = [];
    map.forEach((value, key) => {
      values.push(value);
      keys.push(key);
    });

    expect(values).toEqual(['test value', 'test value2']);
    expect(keys).toEqual(['test', 'test2']);
  });

  it('should for each items and not include deleted', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');
    map.delete('test');

    const values: string[] = [];
    const keys: string[] = [];
    map.forEach((value, key) => {
      values.push(value);
      keys.push(key);
    });

    expect(values).toEqual(['test value2']);
    expect(keys).toEqual(['test2']);
    expect(map.isDeleted('test')).toBe(true);
  });

  it('should check if key exists in the map', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');
    map.delete('test');

    expect(map.has('test')).toBe(false);
    expect(map.has('test2')).toBe(true);
  });

  it('should get keys', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');

    expect(Array.from(map.keys())).toEqual(['test', 'test2']);
  });

  it('should get values', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');

    expect(Array.from(map.values())).toEqual(['test value', 'test value2']);
  });

  it('should get entries', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');

    expect(Array.from(map.entries())).toEqual([
      ['test', 'test value'],
      ['test2', 'test value2'],
    ]);
  });

  it('should get size', () => {
    const map = new TempMap<string, string>(new Map());

    map.set('test', 'test value');
    map.set('test2', 'test value2');

    expect(map.size).toBe(2);
  });

  it('should only delete target value', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    map.set('test', 'test value');
    target.delete('test');

    expect(map.get('test')).toBe('test value');
    expect(target.get('test')).toBeUndefined();
  });

  it('should set target value and also be available in temp map', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    target.set('test', 'test value2');

    expect(map.get('test')).toBe('test value2');
    expect(target.get('test')).toBe('test value2');
  });

  it('should combine keys from target and temp map', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    target.set('test', 'test value2');
    map.set('test2', 'test value');

    expect(Array.from(map.keys())).toEqual(['test', 'test2']);
  });

  it('should combine entries from target and temp map', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    target.set('test', 'test value2');
    map.set('test2', 'test value');

    expect(Array.from(map.entries())).toEqual([
      ['test', 'test value2'],
      ['test2', 'test value'],
    ]);
  });

  it('should combine values from target and temp map', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    target.set('test', 'test value2');
    map.set('test2', 'test value');

    expect(Array.from(map.values())).toEqual(['test value2', 'test value']);
  });

  it('should has target value in temp map', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    target.set('test', 'test value2');

    expect(map.has('test')).toBe(true);
  });

  it('should be iterable', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    target.set('test', 'test value2');
    map.set('test2', 'test value');

    const values: string[] = [];
    const keys: string[] = [];
    for (const [key, value] of map) {
      values.push(value);
      keys.push(key);
    }

    expect(values).toEqual(['test value2', 'test value']);
    expect(keys).toEqual(['test', 'test2']);
  });

  it('should not get deleted keys', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    map.set('test', 'test value2');
    map.set('test2', 'test value');
    map.delete('test2');

    expect(Array.from(map.keys())).toEqual(['test']);
  });

  it('should not get deleted values', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    map.set('test', 'test value2');
    map.set('test2', 'test value');
    map.delete('test2');

    expect(Array.from(map.values())).toEqual(['test value2']);
  });

  it('should not get deleted entries', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    map.set('test', 'test value2');
    map.set('test2', 'test value');
    map.delete('test2');

    expect(Array.from(map.entries())).toEqual([['test', 'test value2']]);
  });

  it('should has toStringTag', () => {
    const target = new Map();
    const map = new TempMap<string, string>(target);

    expect(map[Symbol.toStringTag]).toBe('TempMap');
  });
});
