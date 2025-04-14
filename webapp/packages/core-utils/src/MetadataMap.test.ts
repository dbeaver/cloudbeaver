/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { MetadataMap } from './MetadataMap.js';

describe('MetadataMap', () => {
  it('should create an empty map', () => {
    const map = new MetadataMap<number, string>();

    expect(map.size).toBe(0);
  });

  it('should sync items', () => {
    const map = new MetadataMap<number, string>();
    const emptyMap = new MetadataMap<number, string>();

    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
      [Infinity, 'infinity'],
      [NaN, 'nan'],
    ];

    map.sync(data);
    emptyMap.sync([]);

    data.forEach(([key, value]) => {
      expect(map.get(key)).toBe(value);
    });

    expect(emptyMap.size).toBe(0);
  });

  it('should set items', () => {
    const map = new MetadataMap<number, string>();
    map.set(1, 'one');
    map.set(2, 'two');
    map.set(3, 'three');
    map.set(Infinity, 'infinity');
    map.set(NaN, 'nan');

    expect(map.get(1)).toBe('one');
    expect(map.get(2)).toBe('two');
    expect(map.get(3)).toBe('three');
    expect(map.get(Infinity)).toBe('infinity');
    expect(map.get(NaN)).toBe('nan');
  });

  it('should throw an error if validation failed and no default value getter', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(() => map.get(1, undefined, z.object({}))).toThrow();
  });

  it('should get function default value if validation failed', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(map.get(1, key => `default ${key}`, z.object({}))).toBe('default 1');
  });

  it('should return default value for non existing element using default getter in constructor', () => {
    const map = new MetadataMap<number, string>(key => `default ${key}`);

    expect(map.get(1)).toBe('default 1');
    expect(map.get(Infinity)).toBe('default Infinity');
    expect(map.get(NaN)).toBe('default NaN');
  });

  it('should return size', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(map.size).toBe(3);
  });

  it('should return iterator', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ];
    map.sync(data);

    for (const [key, value] of map) {
      expect(map.get(key)).toBe(value);
    }
  });

  it('should iterate keys', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ];
    const keys = data.map(([key]) => key);

    map.sync(data);

    for (const key of map.keys()) {
      expect(key).toBe(keys.shift());
    }
  });

  it('should iterate values', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ];
    const values = data.map(([, value]) => value);
    map.sync(data);

    for (const value of map.values()) {
      expect(value).toBe(values.shift());
    }
  });

  it('should iterate entries', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ];
    map.sync(data);

    for (const [key, value] of map.entries()) {
      expect([key, value]).toStrictEqual(data.shift());
    }
  });

  it('should check if key exists', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    expect(map.has(1)).toBeTruthy();
    expect(map.has(2)).toBeTruthy();
    expect(map.has(3)).toBeTruthy();
    expect(map.has(4)).toBeFalsy();
  });

  it('should clear', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.clear();

    expect(map.size).toBe(0);
  });

  it('should delete items', () => {
    const map = new MetadataMap<number, string>();
    const data: [number, string][] = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ];

    map.sync(data);

    map.delete(2);
    map.delete(4);
    data.splice(1, 1);

    expect(map.has(2)).toBeFalsy();
    expect(Array.from(map)).toEqual(data);
  });

  it('should forEach', () => {
    const map = new MetadataMap<number, string>();
    map.sync([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);

    map.forEach((value, key) => {
      expect(map.get(key)).toBe(value);
    });
  });

  it('has to string tag', () => {
    const map = new MetadataMap<number, string>();

    expect(map[Symbol.toStringTag]).toBe('MetadataMap');
  });
});
